# Document Forensics AI

A powerful web application for analyzing digital documents to detect signs of tampering, forgery, or manipulation using advanced AI models. This tool leverages multimodal AI to perform forensic analysis on uploaded images of documents, identifying inconsistencies in compression, lighting, text rendering, and other artifacts.

## Features

- **AI-Powered Analysis**: Utilizes state-of-the-art AI models (Google Gemini, OpenAI GPT-5/4o, Azure OpenAI, AWS Bedrock) for comprehensive document forensics
  - **High Accuracy Recommendation**: For the best results, use the OpenAI o3 model, which provides advanced reasoning and superior multimodal analysis for detecting tampering with higher precision.
- **Multi-Provider Support**: Flexible configuration to use different AI providers based on your needs
- **Flexible API Key Management**: 
  - Runtime API key configuration directly in the UI
  - Secure local storage with obfuscation
  - Environment variable fallback support
  - Real-time API key validation
- **Detailed Findings**: Provides structured analysis reports with confidence scores, severity levels, and specific artifact detection
- **Model Configuration**: Easy-to-use interface for selecting and configuring AI models and parameters
- **Real-Time Processing**: Fast analysis with support for various document types and formats
- **User-Friendly Interface**: Modern, responsive UI built with React and Tailwind CSS

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **AI Integration**: Google Gemini, OpenAI GPT-5/4o, Azure OpenAI, AWS Bedrock
- **Build Tools**: Vite, ESLint, PostCSS
- **Development**: Node.js, npm

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- API keys for your chosen AI provider(s)

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd document-forensics-ai
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration (Optional)**
   - **Option A: Runtime API Key Configuration (Recommended)**: You can provide API keys directly in the application's model configuration page without setting environment variables.
   - **Option B: Environment Variables**: For automated deployments or shared configurations:
     - Copy the example environment file:
       ```bash
       cp .env.example .env
       ```
     - Edit `.env` and fill in your API keys:
       - For Google Gemini: Set `VITE_GOOGLE_API_KEY`
       - For OpenAI: Set `VITE_OPENAI_API_KEY` and optionally `VITE_OPENAI_MODEL`
       - For Azure OpenAI: Set `VITE_AZURE_OPENAI_API_KEY`, `VITE_AZURE_OPENAI_ENDPOINT`, and `VITE_AZURE_OPENAI_DEPLOYMENT`
       - For AWS Bedrock: Set `VITE_BEDROCK_PROXY_URL` (requires a server-side proxy)

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8080`

## Usage

1. **Upload a Document**: Use the file upload interface to select an image of the document you want to analyze
2. **Configure AI Model** (Optional): Go to the model configuration page to:
   - Select your preferred AI provider and model
   - **Provide API Keys**: Optionally enter your API keys directly in the interface with the "Show API Keys" toggle
   - Configure model parameters for fine-tuning
3. **Run Analysis**: Click the analyze button to start the forensic examination
4. **Review Results**: View detailed findings, including confidence scores, specific artifacts detected, and recommendations

### API Key Management

The application offers flexible API key management:
- **Runtime Configuration**: Provide API keys directly in the model configuration interface
- **Secure Storage**: API keys are stored locally with basic obfuscation for security
- **Environment Fallback**: If no API key is provided in the interface, the system falls back to environment variables
- **Validation**: Real-time validation ensures API keys are in the correct format
- **Provider Status**: View the current status of environment variables and user-provided keys

## AI Providers and Models

The application supports multiple AI providers:

- **Google Gemini**: `gemini-2.5-flash`, `gemini-2.5-flash-exp`
- **OpenAI**: GPT-5 series, GPT-4.1 series, GPT-4o series, O-series reasoning models
  - **Recommendation**: For the highest accuracy in document forensics analysis, use the OpenAI o3 model from the O-series, which provides advanced reasoning capabilities and superior multimodal analysis.
- **Azure OpenAI**: Enterprise-hosted versions of OpenAI models
- **AWS Bedrock**: OpenAI-compatible models via server-side proxy

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── icons/          # Icon components
│   └── ...             # Feature-specific components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services (AI integration)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # CSS styles
```

## Deployment

### Using Lovable
1. Open [Lovable](https://lovable.dev/projects/032468e8-dafd-442e-9043-5061eae1224f)
2. Click on Share → Publish

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider (Netlify, Vercel, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

---

**Note**: Ensure you have the necessary API keys and comply with the terms of service for the AI providers you choose to use.
