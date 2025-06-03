
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-report-improvements.ts';
import '@/ai/flows/generate-report-summary.ts';
import '@/ai/flows/generate-report-section.ts';
import '@/ai/flows/suggest-service-category.ts';
import '@/ai/flows/prioritize-client-request.ts';
import '@/ai/flows/generate-service-faqs.ts';
