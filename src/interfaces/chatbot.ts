export interface Chatbot {
  id: number;
  filename: string;
  file_type: string;
  status: string;
  total_chunks: number;
  fecha_creacion: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}