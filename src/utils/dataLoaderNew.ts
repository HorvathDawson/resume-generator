import type { ResumeData } from '../types';
import { DEFAULT_RESUME_JSON } from '../data/defaultResumeJson';

// Load default resume data using the same JSON structure as import/export
export async function loadResumeData(): Promise<ResumeData> {
  // Return the default resume data from JSON structure with proper type casting
  return DEFAULT_RESUME_JSON.resumeData as unknown as ResumeData;
}

// Function to simulate JSON import process for default data
export function importDefaultResumeData(): { resumeData: ResumeData; layoutState: any } {
  return {
    resumeData: DEFAULT_RESUME_JSON.resumeData as unknown as ResumeData,
    layoutState: null // No longer need layoutState since we work directly with resumeData.layout
  };
}
