export enum PromptType {
  text_generation = "text_generation",
  data_analysis = "data_analysis",
  translation = "translation",
  image_generation = "image_generation",
  dialogue = "dialogue",
  creative = "creative",
  education = "education",
  video_audio = "video_audio",
  research = "research",
  technical = "technical",
  mobile_app = "mobile_app",
  programming = "programming"
}

export interface OptimizePromptRequest {
  user_request: string;
  language: string;
  prompt_type: PromptType;
}

export interface OptimizePromptResponse {
  optimised_prompt_1: string;
  optimised_prompt_2: string;
}

const API_BASE_URL = 'https://be-copilot.sugarredant.xyz';

export const promptOptimizerApi = {
  async optimizePrompt(request: OptimizePromptRequest): Promise<OptimizePromptResponse> {
    const response = await fetch(`${API_BASE_URL}/prompt-optimizer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
};
