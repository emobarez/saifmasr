
'use server';

/**
 * @fileOverview An AI agent for generating report sections.
 *
 * - generateReportSection - A function that handles the report section generation process.
 * - GenerateReportSectionInput - The input type for the generateReportSection function.
 * - GenerateReportSectionOutput - The return type for the generateReportSection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReportSectionInputSchema = z.object({
  topic: z.string().describe('The main topic for the report section.'),
  keywords: z.string().optional().describe('Comma-separated keywords to focus on within the topic.'),
});
export type GenerateReportSectionInput = z.infer<typeof GenerateReportSectionInputSchema>;

const GenerateReportSectionOutputSchema = z.object({
  generatedSectionText: z.string().describe('The AI-generated text for the report section.'),
});
export type GenerateReportSectionOutput = z.infer<typeof GenerateReportSectionOutputSchema>;

export async function generateReportSection(input: GenerateReportSectionInput): Promise<GenerateReportSectionOutput> {
  return generateReportSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportSectionPrompt',
  input: {schema: GenerateReportSectionInputSchema},
  output: {schema: GenerateReportSectionOutputSchema},
  prompt: `You are an expert report writer tasked with generating a detailed and coherent section for a report.

Topic: {{{topic}}}
{{#if keywords}}
Keywords to emphasize: {{{keywords}}}
{{/if}}

Please generate a well-structured and informative report section based on the provided topic. If keywords are provided, ensure they are naturally integrated and emphasized within the section. The output should be a single block of text suitable for direct inclusion in a larger report.
Focus on clarity, accuracy, and professionalism.
`,
});

const generateReportSectionFlow = ai.defineFlow(
  {
    name: 'generateReportSectionFlow',
    inputSchema: GenerateReportSectionInputSchema,
    outputSchema: GenerateReportSectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
