
'use server';
/**
 * @fileOverview An AI agent for prioritizing client service requests.
 *
 * - prioritizeClientRequest - A function that suggests a priority for a service request.
 * - PrioritizeClientRequestInput - The input type for the prioritizeClientRequest function.
 * - PrioritizeClientRequestOutput - The return type for the prioritizeClientRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeClientRequestInputSchema = z.object({
  requestTitle: z.string().describe('The title or subject of the client service request.'),
  requestDetails: z.string().describe('The detailed description of the client service request.'),
});
export type PrioritizeClientRequestInput = z.infer<typeof PrioritizeClientRequestInputSchema>;

const PrioritizeClientRequestOutputSchema = z.object({
  priority: z.enum(["عالية", "متوسطة", "منخفضة"]).describe('The suggested priority level for the request (High, Medium, or Low, in Arabic).'),
  reasoning: z.string().describe('A brief explanation for the suggested priority.'),
});
export type PrioritizeClientRequestOutput = z.infer<typeof PrioritizeClientRequestOutputSchema>;

export async function prioritizeClientRequest(input: PrioritizeClientRequestInput): Promise<PrioritizeClientRequestOutput> {
  return prioritizeClientRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeClientRequestPrompt',
  input: {schema: PrioritizeClientRequestInputSchema},
  output: {schema: PrioritizeClientRequestOutputSchema},
  prompt: `أنت مدير عمليات متخصص في تحديد أولويات طلبات خدمة العملاء. بناءً على عنوان الطلب وتفاصيله، قم بتحديد مستوى الأولوية (عالية، متوسطة، منخفضة) مع تقديم سبب موجز لهذا التحديد.

عنوان الطلب: {{{requestTitle}}}
تفاصيل الطلب: {{{requestDetails}}}

خذ في الاعتبار كلمات مثل "عاجل"، "هام جداً"، "مشكلة حرجة" للإشارة إلى أولوية عالية. وكلمات مثل "استفسار"، "معلومة"، "اقتراح" قد تشير إلى أولوية أقل. قدم إجابتك بصيغة JSON.
`,
});

const prioritizeClientRequestFlow = ai.defineFlow(
  {
    name: 'prioritizeClientRequestFlow',
    inputSchema: PrioritizeClientRequestInputSchema,
    outputSchema: PrioritizeClientRequestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
