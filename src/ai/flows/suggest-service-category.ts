
'use server';
/**
 * @fileOverview An AI agent for suggesting service categories.
 *
 * - suggestServiceCategory - A function that suggests a category for a service.
 * - SuggestServiceCategoryInput - The input type for the suggestServiceCategory function.
 * - SuggestServiceCategoryOutput - The return type for the suggestServiceCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestServiceCategoryInputSchema = z.object({
  serviceName: z.string().describe('The name of the service.'),
  serviceDescription: z.string().describe('The description of the service.'),
});
export type SuggestServiceCategoryInput = z.infer<typeof SuggestServiceCategoryInputSchema>;

const SuggestServiceCategoryOutputSchema = z.object({
  suggestedCategory: z.string().describe('The AI-suggested category for the service.'),
});
export type SuggestServiceCategoryOutput = z.infer<typeof SuggestServiceCategoryOutputSchema>;

export async function suggestServiceCategory(input: SuggestServiceCategoryInput): Promise<SuggestServiceCategoryOutput> {
  return suggestServiceCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestServiceCategoryPrompt',
  input: {schema: SuggestServiceCategoryInputSchema},
  output: {schema: SuggestServiceCategoryOutputSchema},
  prompt: `You are an expert in service categorization. Based on the service name and description provided, suggest a concise and relevant category for this service. The category should ideally be one or two words.

Service Name: {{{serviceName}}}
Service Description: {{{serviceDescription}}}

Respond with only the suggested category name.
`,
});

const suggestServiceCategoryFlow = ai.defineFlow(
  {
    name: 'suggestServiceCategoryFlow',
    inputSchema: SuggestServiceCategoryInputSchema,
    outputSchema: SuggestServiceCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
