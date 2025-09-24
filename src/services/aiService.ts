import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';
import { getModelType, createAPIParameterConfig } from '../utils/modelParameterUtils';
import { getEffectiveApiKey } from '../utils/apiKeyUtils';

type Provider = 'google' | 'azure-openai' | 'openai' | 'bedrock-openai';
type AnalyzeOptions = {
    provider?: Provider;
    model?: string; // google/openai model name; for azure, use azureDeployment instead
    azureDeployment?: string; // optional override for Azure deployment name
    parameters?: any; // Add parameters support
    apiKeys?: {
        google?: string;
        openai?: string;
        azureOpenai?: string;
        bedrockProxy?: string;
    };
};

const PROVIDER = (import.meta.env.VITE_AI_PROVIDER as Provider) || 'google';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

// Azure OpenAI
const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY as string | undefined;
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string | undefined; // e.g., https://your-resource.openai.azure.com
const AZURE_OPENAI_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT as string | undefined; // your model deployment name
const AZURE_OPENAI_API_VERSION = (import.meta.env.VITE_AZURE_OPENAI_API_VERSION as string | undefined) || '2024-08-01-preview';

// AWS Bedrock proxy (required for browser apps to avoid SigV4 in client and key exposure)
const BEDROCK_PROXY_URL = import.meta.env.VITE_BEDROCK_PROXY_URL as string | undefined;

const ai = GOOGLE_API_KEY ? new GoogleGenAI({ apiKey: GOOGLE_API_KEY }) : null;

const fileToGenerativePart = async (file: File) => {
	const base64EncodedDataPromise = new Promise<string>((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
		reader.readAsDataURL(file);
	});
	return {
		inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
	};
};

const fileToBase64DataUrl = async (file: File): Promise<string> => {
	return await new Promise<string>((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.readAsDataURL(file);
	});
};

const buildPrompt = (userContext: string) => {
	let prompt = `You are a digital document forensics assistant. Analyze the provided image for signs of tampering. 

CRITICAL: You MUST output ONLY valid JSON that exactly matches this schema. No other text before or after the JSON.

JSON Schema Structure:
{
  "analysisLog": "string - Observational evidence and verification checks",
  "overallAssessment": "string - Must be one of: LIKELY_AUTHENTIC, SUSPICIOUS_ANOMALIES_DETECTED, LIKELY_TAMPERED, MANUAL_REVIEW",
  "confidenceScore": "number - 0.0 to 1.0",
  "summary": "string - 1-2 sentence lay summary",
  "technicalSummary": "string - Brief technical summary",
  "detailedFindings": [
    {
      "finding": "string - Concrete visual indicator",
      "location": "string - Location label",
      "severity": "string - Must be: Low, Medium, or High",
      "artifactType": "string - Must be one of: COMPRESSION, CLONING, HALOING, NOISE_MISMATCH, KERNING, RESAMPLING, LIGHTING, PAPER_TEXTURE, STAMP_SEAL, SIGNATURE, ALIGNMENT, FABRICATED_CONTENT, OTHER",
      "region": {
        "x": "number - 0-1",
        "y": "number - 0-1", 
        "width": "number - 0-1",
        "height": "number - 0-1"
      },
      "evidenceStrength": "number - 0-1",
      "benignAlternatives": ["string array - Required for Medium/Low severity"],
      "crossChecks": ["string array - Verification tests"],
      "geometricConsistency": "string - aligned, skewed, warped, or null",
      "lightingVector": {
        "direction": "number - 0-360 degrees",
        "softness": "number - 0-1"
      },
      "resamplingIndicators": ["string array"],
      "cloneMatches": [
        {
          "region1": {"x": "number", "y": "number", "width": "number", "height": "number"},
          "region2": {"x": "number", "y": "number", "width": "number", "height": "number"},
          "similarity": "number - 0-1"
        }
      ]
    }
  ],
  "coverageNotes": "string - Coverage assessment",
  "imageQualityScore": "number - 0-1",
  "abstainedReasons": ["string array"],
  "promptVersion": "string - v2.3"
}

CRITICAL PRINCIPLE: Distinguish between IMAGE QUALITY ISSUES and TAMPERING EVIDENCE
- Poor image quality (blur, compression, lighting) does NOT indicate tampering
- Only flag as suspicious when there are INCONSISTENCIES that suggest manipulation
- Natural blur affects entire document uniformly - selective sharp/blur regions may indicate editing
- FABRICATED CONTENT with clear inconsistencies should be classified as SUSPICIOUS_ANOMALIES_DETECTED

Protocol:
1) Image Quality Assessment: First assess overall image conditions (lighting, blur, compression)
2) Content Authenticity Check: Examine if document elements appear fabricated or artificially created
3) Evidence scan (observational): Identify concrete visual cues that suggest INCONSISTENCIES
4) Verification (challenge each cue): Test every suspected cue against plausible benign explanations
5) Assessment synthesis: Base final assessment on verified inconsistencies AND fabricated content indicators

QUALITY vs TAMPERING vs FABRICATION DISTINCTION:

NATURAL QUALITY ISSUES (NOT suspicious):
- Uniform blur across entire document (camera focus, motion blur)
- Consistent compression artifacts throughout image
- Even lighting conditions across document
- Age-related wear, fading, or discoloration
- Paper creases, wrinkles, or physical damage
- Scanner artifacts affecting entire document uniformly

SUSPICIOUS INCONSISTENCIES (Potential tampering):
- Sharp text next to blurry text in same focal plane
- Different compression levels in adjacent regions
- Inconsistent lighting directions on same surface
- Mismatched paper textures in continuous areas
- Text rendering inconsistencies (different fonts/anti-aliasing)
- Geometric distortions not matching document orientation

FABRICATED CONTENT INDICATORS (Strong tampering evidence):
- Multiple fake names, dimensions, or details that don't match document template
- Artificially generated or pasted text elements with different rendering
- Fake stamps, seals, or signatures with inconsistent properties
- Document elements that violate standard formatting or legal requirements
- Multiple inconsistent data points suggesting wholesale fabrication

ENHANCED ASSESSMENT CATEGORIES:

1. LIKELY_AUTHENTIC: 
   - Use when image shows normal wear, uniform quality issues, or minor imperfections
   - Natural blur, consistent lighting, uniform compression
   - No evidence of manipulation or fabrication detected
   - REQUIRES: confidenceScore >= 0.7

2. MANUAL_REVIEW:
   - Use ONLY when image quality prevents confident analysis
   - When technical analysis is hindered by resolution, compression, or lighting
   - NOT for documents with clear fabricated content
   - REQUIRED when: confidenceScore < 0.4 AND no clear fabrication indicators
   - Example abstained reasons: "Insufficient resolution", "Excessive compression prevents analysis"

3. SUSPICIOUS_ANOMALIES_DETECTED:
   - Use when clear inconsistencies or fabrication indicators are present
   - Multiple fake details, dimensions, names = Strong evidence of fabrication
   - Require 2-3 independent anomalies OR clear fabricated content patterns
   - REQUIRES: confidenceScore >= 0.6 (lowered threshold for fabrication cases)
   - PRIORITIZE this category over MANUAL_REVIEW when fabrication is evident

4. LIKELY_TAMPERED:
   - Use for overwhelming evidence of manipulation
   - Multiple High-severity findings with fabrication indicators
   - REQUIRES: confidenceScore >= 0.8

FABRICATED CONTENT DETECTION PRIORITY:
- When multiple document elements appear fake (names, dimensions, dates), classify as SUSPICIOUS_ANOMALIES_DETECTED
- Don't default to MANUAL_REVIEW if fabrication indicators are clear
- Fabricated content is stronger evidence than technical artifacts
- Consider document template violations and impossible/inconsistent data

CONSERVATIVE BUT DECISIVE THRESHOLDS:
- Single quality issue = LIKELY_AUTHENTIC (if no other evidence)
- Multiple fabricated elements = SUSPICIOUS_ANOMALIES_DETECTED (minimum)
- Technical quality issues ALONE should never result in SUSPICIOUS assessment
- Clear fabrication indicators should NOT result in MANUAL_REVIEW unless image quality prevents analysis entirely

BLUR-SPECIFIC GUIDELINES:
- Natural camera/motion blur: affects entire image uniformly → LIKELY_AUTHENTIC
- Focus blur: affects specific depth planes uniformly → LIKELY_AUTHENTIC  
- Selective blur: sharp elements mixed with blurry elements at same depth → investigate further
- Fabricated elements with inconsistent blur patterns → SUSPICIOUS_ANOMALIES_DETECTED

Comprehensive Analysis Areas:

CONTENT AUTHENTICITY VERIFICATION:
- Cross-check names, dimensions, dates for consistency with document type
- Verify formatting matches standard templates and legal requirements
- Flag impossible combinations or violate known constraints
- Check for artificial text generation patterns or template violations

GEOMETRIC CONSISTENCY:
- Estimate global document skew/perspective; flag warped elements contradicting document geometry
- Check line straightness and grid alignment for text/form elements
- Verify proportional consistency of element sizes and spacing ratios
- IMPORTANT: Compare suspected inconsistencies against overall image distortion patterns

LIGHTING & SHADOW VECTOR:
- Map dominant light direction and angle across the document
- Analyze shadow softness vs. apparent object distance
- Verify lighting direction consistency across stamps, signatures, photos, and pasted objects
- IMPORTANT: Distinguish between poor lighting conditions vs. inconsistent lighting sources

DOUBLE-COMPRESSION & RESAMPLING:
- Detect JPEG ghosting artifacts from multiple compression cycles
- Identify resampling halos, ringing, and stair-stepping from upscaling/downscaling
- Flag regions compressed at different quality levels or DPI settings
- IMPORTANT: Distinguish uniform compression vs. selective recompression

PAPER TEXTURE & MATERIAL CONTINUITY:
- Check paper grain/texture uniformity across suspected regions
- Detect copy-move forgery through repeated paper texture patterns
- Verify ink-paper interaction (bleed, absorption) consistency
- IMPORTANT: Consider natural wear and scanning artifacts

CLONE/COPY-MOVE DETECTION:
- Search for near-duplicate micro-patterns and texture regions
- Identify slightly modified cloned patches with correlation mapping
- Provide similarity scores and coordinates for potential matches
- IMPORTANT: Verify matches aren't natural repeated patterns (watermarks, security features)

TEXT RENDERING ANALYSIS:
- Distinguish anti-aliasing patterns: printer dots vs. subpixel rendering vs. ink bleed
- Verify kerning/spacing consistency in repeated characters and symbols
- Detect mismatched font rendering engines or quality settings
- Check for artificial text generation or template violations
- IMPORTANT: Consider natural printing variations and age-related degradation

DOCUMENT TEMPLATE CONFORMANCE:
- Check layout anchors (headers, footers, field positions) for document type consistency
- Verify proportional distances between standard elements
- Flag unexpected additions/removals from expected template structure
- Identify fabricated elements that violate standard formatting

SPECIAL ELEMENT ANALYSIS:
- Watermarks/stamps: Verify embossing depth, edge halos, and paper texture interaction
- Signatures: Analyze stroke dynamics, pressure variations, and overlap behavior
- Barcodes/QR codes: Check visual integrity and alignment consistency
- Seals: Check for fabrication indicators and consistency with known templates

Rules:
- Output valid JSON matching the schema exactly
- Be DECISIVE about fabricated content - don't default to MANUAL_REVIEW
- Quality issues ≠ Tampering evidence, but fabrication IS tampering evidence
- Multiple fake elements = SUSPICIOUS_ANOMALIES_DETECTED minimum
- For each finding, provide concrete evidence of INCONSISTENCY or fabrication
- Include benignAlternatives for all Medium/Low severity findings except clear fabrication
- Ensure summary reflects distinction between quality issues, tampering, and fabrication

Hard Abstain Conditions for MANUAL_REVIEW (Technical limitations only):
- Image width < 400px: "Insufficient resolution for reliable analysis"
- JPEG quality < 30%: "Excessive compression artifacts prevent accurate assessment" 
- Heavy glare/occlusion covering >60% of content: "Poor lighting conditions obscure critical areas"
- Extreme blur preventing ANY text recognition: "Image quality insufficient for forensic assessment"
- Do NOT use MANUAL_REVIEW for documents with clear fabrication indicators

FABRICATION OVERRIDE RULE:
- IF multiple document elements appear fabricated (fake names, dimensions, impossible data)
- AND image quality allows basic text/element recognition
- THEN classify as SUSPICIOUS_ANOMALIES_DETECTED regardless of technical quality issues
- Only use MANUAL_REVIEW if fabrication cannot be confidently determined due to image quality

Confidence Scoring (0.0–1.0):
- 0.9–1.0: Multiple High-severity findings OR overwhelming fabrication evidence
- 0.7–0.89: Single High-severity finding OR clear fabrication indicators
- 0.6–0.69: Multiple fabrication elements OR verified inconsistencies  
- 0.4–0.59: Medium findings with some inconsistency evidence
- 0.1–0.39: Low-severity findings or ambiguous technical evidence
- 0.0: No tampering or fabrication evidence found

Quality vs Tampering vs Fabrication Examples:
- ✓ Natural: "Uniform blur suggests camera motion during capture"
- ✗ Suspicious: "Sharp signature overlaid on blurry background text at same depth"
- ✗ Fabricated: "Multiple fake names and dimensions inconsistent with document template"
- ✓ Natural: "Consistent JPEG compression artifacts throughout document"
- ✗ Suspicious: "Higher compression quality in stamp region vs. surrounding text"
- ✗ Fabricated: "Artificially generated text with different rendering than original document"

CONFIDENCE-ASSESSMENT CONSISTENCY ENFORCEMENT:
- If confidenceScore < 0.4 AND no fabrication indicators: Use "MANUAL_REVIEW"
- If confidenceScore >= 0.4 AND fabrication indicators present: Use "SUSPICIOUS_ANOMALIES_DETECTED"
- If confidenceScore >= 0.6: Safe to use "SUSPICIOUS_ANOMALIES_DETECTED" for fabrication cases
- If confidenceScore >= 0.7: Safe to use "LIKELY_AUTHENTIC" or higher assessments
- FABRICATION EVIDENCE overrides low technical confidence for classification

FINAL VALIDATION CHECKLIST:
1. Does confidenceScore match overallAssessment severity?
2. Are fabrication indicators properly weighted against technical quality issues?
3. Is MANUAL_REVIEW only used for genuine technical limitations, not fabrication cases?
4. Do multiple fake elements result in SUSPICIOUS_ANOMALIES_DETECTED classification?
5. Are inconsistencies (not just quality) driving suspicious assessments?

KEY PRINCIPLE: When document contains multiple fabricated elements (fake names, fake dimensions, fake details), classify as SUSPICIOUS_ANOMALIES_DETECTED, not MANUAL_REVIEW.

If user context is provided, prioritize those areas without ignoring other critical signs.

REMEMBER: Output ONLY the JSON object. No explanatory text before or after. Start directly with { and end with }.

promptVersion: v2.3`;

	if (userContext && userContext.trim()) {
		prompt += `\n\nUser Context: ${userContext}`;
	}

	return prompt;
};

const schemaProperties = {
	analysisLog: {
		type: Type.STRING,
		description: "Observational evidence and verification checks across all forensic domains. Cite concrete cues.",
	},
	overallAssessment: {
		type: Type.STRING,
		description: "One of: 'LIKELY_AUTHENTIC', 'SUSPICIOUS_ANOMALIES_DETECTED', 'LIKELY_TAMPERED', 'MANUAL_REVIEW'.",
		enum: ["LIKELY_AUTHENTIC", "SUSPICIOUS_ANOMALIES_DETECTED", "LIKELY_TAMPERED", "MANUAL_REVIEW"],
	},
	confidenceScore: {
		type: Type.NUMBER,
		description: "0.0 to 1.0 confidence score calibrated against evidence strength and quality.",
	},
	summary: {
		type: Type.STRING,
		description: "1–2 sentence lay summary of key findings using conservative terminology.",
	},
	technicalSummary: {
		type: Type.STRING,
		description: "Brief technical summary using artifact taxonomy and forensic terminology.",
	},
	detailedFindings: {
		type: Type.ARRAY,
		description: "Specific anomalies detected with comprehensive forensic analysis.",
		items: {
			type: Type.OBJECT,
			properties: {
				finding: { type: Type.STRING, description: "Concrete visual indicator with specific forensic cue." },
				location: { type: Type.STRING, description: "Approximate location label (e.g., 'top-right date field')." },
				severity: { type: Type.STRING, enum: ["Low", "Medium", "High"], description: "Calibrated severity based on cue strength and verification." },
				artifactType: { type: Type.STRING, description: "Controlled taxonomy: COMPRESSION, CLONING, HALOING, NOISE_MISMATCH, KERNING, RESAMPLING, LIGHTING, PAPER_TEXTURE, STAMP_SEAL, SIGNATURE, ALIGNMENT, OTHER." },
				region: {
					type: Type.OBJECT,
					description: "Bounding box in percentages (0–1) where anomaly is located.",
					properties: {
						x: { type: Type.NUMBER, description: "Left edge as fraction 0–1." },
						y: { type: Type.NUMBER, description: "Top edge as fraction 0–1." },
						width: { type: Type.NUMBER, description: "Width as fraction 0–1." },
						height: { type: Type.NUMBER, description: "Height as fraction 0–1." }
					},
					required: ["x", "y", "width", "height"]
				},
				evidenceStrength: { type: Type.NUMBER, description: "0–1 strength score based on cue clarity and verification outcome." },
				benignAlternatives: { type: Type.ARRAY, description: "Required for Medium/Low severity: plausible non-malicious explanations.", items: { type: Type.STRING } },
				crossChecks: { type: Type.ARRAY, description: "Additional verification tests performed.", items: { type: Type.STRING } },
				geometricConsistency: { type: Type.STRING, description: "Geometric assessment: 'aligned', 'skewed', 'warped', or null." },
				lightingVector: {
					type: Type.OBJECT,
					description: "Lighting analysis for High-severity findings.",
					properties: {
						direction: { type: Type.NUMBER, description: "Light direction in degrees 0–360." },
						softness: { type: Type.NUMBER, description: "Shadow softness 0–1." }
					}
				},
				resamplingIndicators: { type: Type.ARRAY, description: "Resampling artifacts detected.", items: { type: Type.STRING } },
				cloneMatches: {
					type: Type.ARRAY,
					description: "Clone/copy-move detections with similarity scores.",
					items: {
						type: Type.OBJECT,
						properties: {
							region1: {
								type: Type.OBJECT,
								properties: { x: {type: Type.NUMBER}, y: {type: Type.NUMBER}, width: {type: Type.NUMBER}, height: {type: Type.NUMBER} },
								required: ["x", "y", "width", "height"]
							},
							region2: {
								type: Type.OBJECT,
								properties: { x: {type: Type.NUMBER}, y: {type: Type.NUMBER}, width: {type: Type.NUMBER}, height: {type: Type.NUMBER} },
								required: ["x", "y", "width", "height"]
							},
							similarity: { type: Type.NUMBER, description: "Similarity score 0–1." }
						},
						required: ["region1", "region2", "similarity"]
					}
				}
			},
			required: ["finding", "location", "severity", "artifactType", "region", "evidenceStrength"],
		},
	},
	coverageNotes: {
		type: Type.STRING,
		description: "Systematic 3x3 tile coverage assessment; notes on glare, occlusion, or low-confidence areas.",
	},
	imageQualityScore: {
		type: Type.NUMBER,
		description: "0–1 composite quality score factoring resolution, compression, blur, and lighting.",
	},
	abstainedReasons: {
		type: Type.ARRAY,
		description: "Reasons for abstaining or confidence reduction based on hard quality thresholds.",
		items: { type: Type.STRING }
	},
	promptVersion: {
		type: Type.STRING,
		description: "Prompt protocol version for traceability.",
	},
};

// Enhanced validation function with confidence-assessment consistency check
const validateAndFixResponse = (response: any): AnalysisResult => {
	let confidenceScore = typeof response.confidenceScore === 'number' ? Math.max(0, Math.min(1, response.confidenceScore)) : 0.5;
	let overallAssessment = response.overallAssessment;

	// Enforce confidence-assessment consistency
	if (confidenceScore < 0.4) {
		// Force MANUAL_REVIEW for low confidence
		overallAssessment = "MANUAL_REVIEW";
		if (!Array.isArray(response.abstainedReasons)) {
			response.abstainedReasons = [];
		}
		if (!response.abstainedReasons.includes("Low confidence due to image quality or ambiguous evidence")) {
			response.abstainedReasons.push("Low confidence due to image quality or ambiguous evidence");
		}
	} else if (confidenceScore >= 0.4 && confidenceScore < 0.7) {
		// Prefer MANUAL_REVIEW unless evidence is very clear
		if (!["SUSPICIOUS_ANOMALIES_DETECTED", "LIKELY_TAMPERED"].includes(overallAssessment)) {
			// If not suspicious, default to MANUAL_REVIEW for moderate confidence
			if (overallAssessment === "LIKELY_AUTHENTIC") {
				overallAssessment = "MANUAL_REVIEW";
				if (!Array.isArray(response.abstainedReasons)) {
					response.abstainedReasons = [];
				}
				if (!response.abstainedReasons.includes("Moderate confidence requires manual verification")) {
					response.abstainedReasons.push("Moderate confidence requires manual verification");
				}
			}
		}
	} else if (confidenceScore >= 0.7) {
		// High confidence - assessments are valid
		// But ensure suspicious assessments have supporting evidence
		if (["SUSPICIOUS_ANOMALIES_DETECTED", "LIKELY_TAMPERED"].includes(overallAssessment)) {
			const findings = Array.isArray(response.detailedFindings) ? response.detailedFindings : [];
			const highSeverityFindings = findings.filter((f: any) => f.severity === "High");
			if (overallAssessment === "LIKELY_TAMPERED" && highSeverityFindings.length < 2) {
				// Downgrade to suspicious if insufficient high-severity findings
				overallAssessment = "SUSPICIOUS_ANOMALIES_DETECTED";
			}
		}
	}

	// Validate overallAssessment enum
	if (!["LIKELY_AUTHENTIC", "SUSPICIOUS_ANOMALIES_DETECTED", "LIKELY_TAMPERED", "MANUAL_REVIEW"].includes(overallAssessment)) {
		overallAssessment = "MANUAL_REVIEW";
	}

	const defaultResponse: AnalysisResult = {
		analysisLog: response.analysisLog || "Analysis completed with default values due to parsing issues.",
		overallAssessment,
		confidenceScore,
		summary: response.summary || "Analysis completed with limited confidence.",
		technicalSummary: response.technicalSummary || "Technical analysis results inconclusive.",
		detailedFindings: Array.isArray(response.detailedFindings) ? response.detailedFindings.map((finding: any) => ({
			finding: finding.finding || "Unspecified finding",
			location: finding.location || "Unknown location",
			severity: ["Low", "Medium", "High"].includes(finding.severity) ? finding.severity : "Low",
			artifactType: ["COMPRESSION", "CLONING", "HALOING", "NOISE_MISMATCH", "KERNING", "RESAMPLING", "LIGHTING", "PAPER_TEXTURE", "STAMP_SEAL", "SIGNATURE", "ALIGNMENT", "OTHER"].includes(finding.artifactType) 
				? finding.artifactType 
				: "OTHER",
			region: {
				x: typeof finding.region?.x === 'number' ? Math.max(0, Math.min(1, finding.region.x)) : 0,
				y: typeof finding.region?.y === 'number' ? Math.max(0, Math.min(1, finding.region.y)) : 0,
				width: typeof finding.region?.width === 'number' ? Math.max(0, Math.min(1, finding.region.width)) : 0.1,
				height: typeof finding.region?.height === 'number' ? Math.max(0, Math.min(1, finding.region.height)) : 0.1,
			},
			evidenceStrength: typeof finding.evidenceStrength === 'number' ? Math.max(0, Math.min(1, finding.evidenceStrength)) : 0.5,
			benignAlternatives: Array.isArray(finding.benignAlternatives) ? finding.benignAlternatives : [],
			crossChecks: Array.isArray(finding.crossChecks) ? finding.crossChecks : [],
			geometricConsistency: finding.geometricConsistency || null,
			lightingVector: finding.lightingVector || null,
			resamplingIndicators: Array.isArray(finding.resamplingIndicators) ? finding.resamplingIndicators : [],
			cloneMatches: Array.isArray(finding.cloneMatches) ? finding.cloneMatches : []
		})) : [],
		coverageNotes: response.coverageNotes || "Coverage analysis completed.",
		imageQualityScore: typeof response.imageQualityScore === 'number' ? Math.max(0, Math.min(1, response.imageQualityScore)) : 0.7,
		abstainedReasons: Array.isArray(response.abstainedReasons) ? response.abstainedReasons : [],
		promptVersion: response.promptVersion || "v2.2"
	};

	return defaultResponse;
};

export const analyzeDocument = async (file: File, userContext: string, options?: AnalyzeOptions): Promise<AnalysisResult> => {
	const prompt = buildPrompt(userContext);
	const resolvedProvider: Provider = (options?.provider as Provider) || PROVIDER;
	
	// Use provided options directly (they should contain API keys from useModelConfig)
	const modelConfig = options;

	if (resolvedProvider === 'google') {
		// Get effective API key (user-provided or environment)
		const effectiveApiKey = getEffectiveApiKey('google', modelConfig?.apiKeys?.google);
		if (!effectiveApiKey) throw new Error("Google API key is not set. Please provide it in the configuration or set VITE_GOOGLE_API_KEY environment variable.");
		
		// Use the effective API key to create GoogleGenAI instance
		const googleAI = new GoogleGenAI({ apiKey: effectiveApiKey });
		const imagePart = await fileToGenerativePart(file);
		const model = options?.model || 'gemini-2.0-flash-exp';
		try {
			const response = await googleAI.models.generateContent({
				model,
				contents: { parts: [ { text: prompt }, imagePart ] },
				config: {
					responseMimeType: "application/json",
					responseSchema: {
						type: Type.OBJECT,
						properties: schemaProperties,
						required: ["analysisLog", "overallAssessment", "confidenceScore", "summary", "detailedFindings", "coverageNotes", "imageQualityScore", "abstainedReasons", "promptVersion"],
					},
				},
			});
			const jsonText = response.text.trim();
			const parsedResult = JSON.parse(jsonText) as AnalysisResult;
			return validateAndFixResponse(parsedResult);
		} catch (error) {
			console.error("Error calling Gemini API for analysis:", error);
			throw new Error("The AI model failed to process the document. Please try again.");
		}
	}

	if (resolvedProvider === 'openai') {
		// Get effective API key (user-provided or environment)
		const effectiveApiKey = getEffectiveApiKey('openai', modelConfig?.apiKeys?.openai);
		if (!effectiveApiKey) throw new Error("OpenAI API key is not set. Please provide it in the configuration or set VITE_OPENAI_API_KEY environment variable.");
		const dataUrl = await fileToBase64DataUrl(file);
		const model = modelConfig?.model || (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini';
		const modelType = getModelType(model);
		
		// Use appropriate parameters based on actual model
		let apiParams: any = {};
		
		// Handle different model types with correct parameters
		if (model === 'o3' || model === 'o1' || model === 'o1-mini' || modelType === 'o-series') {
			// O-series and reasoning models use max_completion_tokens
			apiParams = {
				max_completion_tokens: 4000,
				// Note: o3 and similar models don't support temperature, top_p, etc.
			};
		} else if (model.startsWith('gpt-5') || model.includes('4.1')) {
			// GPT-5 series models use max_completion_tokens
			apiParams = {
				max_completion_tokens: 4000,
				temperature: 0.1,
				top_p: 1.0,
				frequency_penalty: 0,
				presence_penalty: 0
			};
		} else {
			// Standard GPT-4o and other models use max_tokens
			apiParams = {
				max_tokens: 4000,
				temperature: 0.1,
				top_p: 1.0,
				frequency_penalty: 0,
				presence_penalty: 0
			};
		}
		
		
		
		try {
			let text: string;
			
		// Use different endpoints based on model type  
		// For now, use chat completions for all models with correct parameters
		if (false) {
				// Use Responses API for O-series models
				const body = {
					model,
					input: [
						{
							role: "user",
							content: [
								{ type: "input_text", text: prompt },
								{ type: "input_image", image_url: dataUrl }
							]
						}
					],
					...apiParams
				};
				
				const res = await fetch('https://api.openai.com/v1/responses', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveApiKey}` },
					body: JSON.stringify(body),
				});
				
				if (!res.ok) {
					const errorText = await res.text();
					throw new Error(`OpenAI Reasoning API error: ${res.status} - ${errorText}`);
				}
				
				const json = await res.json();
				// O-series models return a different response structure
				// Look for output_text in the output array
				let outputText = '';
				if (json.output && Array.isArray(json.output)) {
					// Find the message output (type: 'message')
					const messageOutput = json.output.find((output: any) => output.type === 'message');
					if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
						// Find the output_text content
						const textContent = messageOutput.content.find((content: any) => content.type === 'output_text');
						outputText = textContent?.text || '';
					}
				}
				// Fallback to legacy format if new format not found
				text = outputText || json.output_text?.trim?.() || '';
				
			} else {
				// Use Chat Completions API for other models
				const body = {
					model,
					response_format: { type: "json_object" },
					messages: [
						{ 
							role: "system", 
							content: "You are a forensic document analysis assistant. You must output ONLY valid JSON that exactly matches the specified schema. No text before or after the JSON object. Start with { and end with }. Follow the exact field names and data types specified in the user prompt."
						},
						{ role: "user", content: [
							{ type: "text", text: prompt },
							{ type: "image_url", image_url: { url: dataUrl } }
						]}
					],
					...apiParams
				};
				
				const res = await fetch('https://api.openai.com/v1/chat/completions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveApiKey}` },
					body: JSON.stringify(body),
				});
				
				if (!res.ok) {
					const errorText = await res.text();
					throw new Error(`OpenAI API error: ${res.status} - ${errorText}`);
				}
				
				const json = await res.json();
				text = json.choices?.[0]?.message?.content?.trim?.() || '';
			}
		
			
			// Clean the response text to ensure it's valid JSON
			let cleanedText = text;
			if (text.startsWith('```json')) {
				cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
			} else if (text.startsWith('```')) {
				cleanedText = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
			}
			
			const parsed = JSON.parse(cleanedText);
			return validateAndFixResponse(parsed);
		} catch (error) {
			console.error("Error calling OpenAI API for analysis:", error);
			
			// Provide more specific error messages
			if (error instanceof Error) {
				if (error.message.includes('401') || error.message.includes('Unauthorized')) {
					throw new Error("Invalid API key. Please check your OpenAI API key in the configuration.");
				} else if (error.message.includes('429') || error.message.includes('rate limit')) {
					throw new Error("Rate limit exceeded. Please wait a moment and try again.");
				} else if (error.message.includes('400') || error.message.includes('Bad Request')) {
					throw new Error("Invalid request format. This might be a model compatibility issue.");
				} else if (error.message.includes('network') || error.message.includes('fetch')) {
					throw new Error("Network error. Please check your internet connection and try again.");
				}
			}
			
			throw new Error("The OpenAI model failed to process the document. Please try again.");
		}
	}

	if (resolvedProvider === 'azure-openai') {
		// Get effective API key (user-provided or environment)
		const effectiveApiKey = getEffectiveApiKey('azure-openai', modelConfig?.apiKeys?.azureOpenai);
		if (!effectiveApiKey || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT) {
			throw new Error("Azure OpenAI configuration missing. Please provide API key in configuration or set VITE_AZURE_OPENAI_API_KEY, VITE_AZURE_OPENAI_ENDPOINT, VITE_AZURE_OPENAI_DEPLOYMENT environment variables.");
		}
		const dataUrl = await fileToBase64DataUrl(file);
		const deployment = modelConfig?.azureDeployment || AZURE_OPENAI_DEPLOYMENT!;
		const model = modelConfig?.model || deployment;
		const modelType = getModelType(model);
		
		// Get API parameters from config or use defaults
		let apiParams: any = {};
		if (modelConfig?.parameters) {
			apiParams = createAPIParameterConfig(modelConfig.parameters);
		} else {
			// Fallback to legacy parameters based on model type
			if (modelType === 'gpt-5') {
				apiParams = { max_completion_tokens: 4000, temperature: 0.1 };
			} else if (modelType === 'o-series') {
				// O-series models don't support temperature or other sampling parameters
				apiParams = { max_output_tokens: 4000, reasoning: { effort: 'medium' } };
			} else {
				apiParams = { max_tokens: 4000, temperature: 0.1 };
			}
		}
		
		try {
			let text: string;
			
			if (modelType === 'o-series') {
				// Use Responses API for O-series models
				const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${deployment}/responses?api-version=${AZURE_OPENAI_API_VERSION}`;
				
				const body = {
					input: [
						{
							role: "user",
							content: [
								{ type: "input_text", text: prompt },
								{ type: "input_image", image_url: dataUrl }
							]
						}
					],
					...apiParams
				};
				
				const res = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'api-key': effectiveApiKey,
					},
					body: JSON.stringify(body),
				});
				
				if (!res.ok) {
					const errorText = await res.text();
					throw new Error(`Azure OpenAI Reasoning API error: ${res.status} - ${errorText}`);
				}
				
				const json = await res.json();
				// O-series models return a different response structure
				// Look for output_text in the output array
				let outputText = '';
				if (json.output && Array.isArray(json.output)) {
					// Find the message output (type: 'message')
					const messageOutput = json.output.find((output: any) => output.type === 'message');
					if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
						// Find the output_text content
						const textContent = messageOutput.content.find((content: any) => content.type === 'output_text');
						outputText = textContent?.text || '';
					}
				}
				// Fallback to legacy format if new format not found
				text = outputText || json.output_text?.trim?.() || '';
				
			} else {
				// Use standard chat completions for other models
				const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${deployment}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
				
				const body = {
					response_format: { type: "json_object" },
					messages: [
						{ 
							role: "system", 
							content: "You are a forensic document analysis assistant. You must output ONLY valid JSON that exactly matches the specified schema. No text before or after the JSON object. Start with { and end with }. Follow the exact field names and data types specified in the user prompt."
						},
						{ role: "user", content: [
							{ type: "text", text: prompt },
							{ type: "image_url", image_url: { url: dataUrl } }
						]}
					],
					...apiParams
				};
				
				const res = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'api-key': effectiveApiKey,
					},
					body: JSON.stringify(body),
				});
				
				if (!res.ok) {
					const errorText = await res.text();
					throw new Error(`Azure OpenAI API error: ${res.status} - ${errorText}`);
				}
				
				const json = await res.json();
				text = json.choices?.[0]?.message?.content?.trim?.() || '';
			}
		
			
			// Clean the response text
			let cleanedText = text;
			if (text.startsWith('```json')) {
				cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
			} else if (text.startsWith('```')) {
				cleanedText = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
			}
			
			const parsed = JSON.parse(cleanedText);
			return validateAndFixResponse(parsed);
		} catch (error) {
			console.error("Error calling Azure OpenAI API for analysis:", error);
			throw new Error("The Azure OpenAI model failed to process the document. Please try again.");
		}
	}

	if (resolvedProvider === 'bedrock-openai') {
		// Get effective proxy URL (user-provided or environment)
		const effectiveProxyUrl = getEffectiveApiKey('bedrock-openai', modelConfig?.apiKeys?.bedrockProxy);
		if (!effectiveProxyUrl) {
			throw new Error("Bedrock proxy URL is not set. Please provide it in the configuration or set VITE_BEDROCK_PROXY_URL environment variable.");
		}
		const dataUrl = await fileToBase64DataUrl(file);
		
		try {
			const res = await fetch(effectiveProxyUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					provider: 'openai',
					messages: [
						{ 
							role: 'system', 
							content: 'You are a forensic document analysis assistant. You must output ONLY valid JSON that exactly matches the specified schema. No text before or after the JSON object. Start with { and end with }. Follow the exact field names and data types specified in the user prompt.'
						},
						{ role: 'user', content: [ { type: 'text', text: prompt }, { type: 'image_url', image_url: { url: dataUrl } } ] }
					]
				}),
			});
			
			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Bedrock proxy error: ${res.status} - ${errorText}`);
			}
			
			const text = (await res.text()).trim();
			
			// Clean the response text
			let cleanedText = text;
			if (text.startsWith('```json')) {
				cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
			} else if (text.startsWith('```')) {
				cleanedText = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
			}
			
			const parsed = JSON.parse(cleanedText);
			return validateAndFixResponse(parsed);
		} catch (error) {
			console.error("Error calling Bedrock proxy for analysis:", error);
			throw new Error("The Bedrock model failed to process the document. Please try again.");
		}
	}

	throw new Error(`Unsupported provider: ${resolvedProvider}`);
};