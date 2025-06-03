
'use server';
/**
 * @fileOverview An AI agent for generating Frequently Asked Questions (FAQs) for services.
 *
 * - generateServiceFAQs - A function that generates FAQs based on service details.
 * - GenerateServiceFAQsInput - The input type for the generateServiceFAQs function.
 * - GenerateServiceFAQsOutput - The return type for the generateServiceFAQs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FAQItemSchema = z.object({
  question: z.string().describe('A frequently asked question about the service.'),
  answer: z.string().describe('A concise and informative answer to the question.'),
});

const GenerateServiceFAQsInputSchema = z.object({
  serviceName: z.string().describe('The name of the service.'),
  serviceDescription: z.string().describe('A detailed description of the service.'),
  faqCount: z.number().optional().default(3).describe('The desired number of FAQs to generate (e.g., 3-5).'),
});
export type GenerateServiceFAQsInput = z.infer<typeof GenerateServiceFAQsInputSchema>;

const GenerateServiceFAQsOutputSchema = z.object({
  faqs: z.array(FAQItemSchema).describe('An array of generated FAQ items, each containing a question and an answer.'),
});
export type GenerateServiceFAQsOutput = z.infer<typeof GenerateServiceFAQsOutputSchema>;

export async function generateServiceFAQs(input: GenerateServiceFAQsInput): Promise<GenerateServiceFAQsOutput> {
  return generateServiceFAQsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateServiceFAQsPrompt',
  input: {schema: GenerateServiceFAQsInputSchema},
  output: {schema: GenerateServiceFAQsOutputSchema},
  prompt: `You are an expert content creator specializing in generating helpful Frequently Asked Questions (FAQs) for services.
Based on the service name and description provided, generate a list of {{{faqCount}}} relevant FAQs. Each FAQ should have a clear question and a concise, informative answer.

Service Name: {{{serviceName}}}
Service Description: {{{serviceDescription}}}

Focus on questions that a potential customer might have about the service.
Ensure the answers are accurate based on the provided description.
Structure the output as a JSON object containing an array of FAQ items.
`,
});

const generateServiceFAQsFlow = ai.defineFlow(
  {
    name: 'generateServiceFAQsFlow',
    inputSchema: GenerateServiceFAQsInputSchema,
    outputSchema: GenerateServiceFAQsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
