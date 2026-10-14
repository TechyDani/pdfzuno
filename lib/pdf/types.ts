export type ProcessOptions = {
  pages: string;
  text: string;
  angle: string;
  margin: string;
  x: string;
  y: string;
  size: string;
  password: string;
  newPassword: string;
  quality: string;
  mode: string;
  targetPage: string;
  width: string;
  height: string;
  signature: string;
};
export const defaultOptions: ProcessOptions = {
  pages: "1",
  text: "",
  angle: "90",
  margin: "20",
  x: "40",
  y: "40",
  size: "18",
  password: "",
  newPassword: "",
  quality: "balanced",
  mode: "editable",
  targetPage: "1",
  width: "180",
  height: "55",
  signature: "",
};
export type ToolResult = {
  bytes: Uint8Array;
  filename: string;
  mime: string;
  message: string;
};
export type Progress = (message: string, percent: number) => void;
