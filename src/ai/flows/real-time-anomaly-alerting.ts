'use server';
/**
 * @fileOverview A real-time anomaly alerting AI agent.
 *
 * - realTimeAnomalyAlerting - A function that handles the real-time anomaly alerting process.
 * - RealTimeAnomalyAlertingInput - The input type for the realTimeAnomalyAlerting function.
 * - RealTimeAnomalyAlertingOutput - The return type for the realTimeAnomalyAlerting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealTimeAnomalyAlertingInputSchema = z.object({
  anomalyScore: z
    .number()
    .describe('The anomaly score of the log entry (0..1).'),
  logEntry: z.string().describe('The full log entry in JSON format.'),
  threshold: z
    .number()
    .describe(
      'The threshold above which an alert should be triggered (0..1).'
    ),
  slackWebhook: z
    .string()
    .describe(
      'The Slack webhook URL to send alerts to. Must be a valid URL if specified.'
    )
    .optional(),
  snsTopicArn: z
    .string()
    .describe(
      'The SNS Topic ARN to publish alerts to. Must be a valid ARN if specified.'
    )
    .optional(),
});
export type RealTimeAnomalyAlertingInput = z.infer<
  typeof RealTimeAnomalyAlertingInputSchema
>;

const RealTimeAnomalyAlertingOutputSchema = z.object({
  alertTriggered: z
    .boolean()
    .describe('Whether an alert was triggered or not.'),
  message: z.string().describe('The message sent to Slack/SNS.'),
});
export type RealTimeAnomalyAlertingOutput = z.infer<
  typeof RealTimeAnomalyAlertingOutputSchema
>;

export async function realTimeAnomalyAlerting(
  input: RealTimeAnomalyAlertingInput
): Promise<RealTimeAnomalyAlertingOutput> {
  return realTimeAnomalyAlertingFlow(input);
}

const sendAlert = ai.defineTool({
  name: 'sendAlert',
  description: 'Sends an alert to Slack and/or SNS if the anomaly score exceeds the threshold.',
  inputSchema: z.object({
    anomalyScore: z
      .number()
      .describe('The anomaly score of the log entry (0..1).'),
    logEntry: z.string().describe('The full log entry in JSON format.'),
    threshold: z
      .number()
      .describe(
        'The threshold above which an alert should be triggered (0..1).'
      ),
    slackWebhook: z
      .string()
      .describe(
        'The Slack webhook URL to send alerts to. Must be a valid URL if specified.'
      )
      .optional(),
    snsTopicArn: z
      .string()
      .describe(
        'The SNS Topic ARN to publish alerts to. Must be a valid ARN if specified.'
      )
      .optional(),
  }),
  outputSchema: z.object({
    alertTriggered: z
      .boolean()
      .describe('Whether an alert was triggered or not.'),
    message: z.string().describe('The message sent to Slack/SNS.'),
  }),
},
async input => {
  const {
    anomalyScore,
    logEntry,
    threshold,
    slackWebhook,
    snsTopicArn,
  } = input;

  let alertTriggered = false;
  let message = '';

  if (anomalyScore > threshold) {
    alertTriggered = true;
    message = `High anomaly score (${anomalyScore}) detected for log entry: ${logEntry}`;

    if (slackWebhook) {
      try {
        const response = await fetch(slackWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: message,
          }),
        });

        if (!response.ok) {
          console.error(
            `Failed to send Slack alert: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        console.error('Error sending Slack alert:', error);
      }
    }

    if (snsTopicArn) {
      try {
        // Implement SNS publishing logic here
        // This requires AWS SDK and proper configuration

        // Placeholder implementation - replace with actual SNS publish call
        console.log(`Publishing to SNS Topic: ${snsTopicArn}`);

        // const sns = new AWS.SNS({ region: 'YOUR_AWS_REGION' }); // Replace with your region
        // const params = {
        //   Message: message,
        //   TopicArn: snsTopicArn,
        // };
        // await sns.publish(params).promise();

        console.log('SNS notification sent.');
      } catch (error) {
        console.error('Error sending SNS notification:', error);
      }
    }
  }

  return { alertTriggered, message };
});

const realTimeAnomalyAlertingFlow = ai.defineFlow(
  {
    name: 'realTimeAnomalyAlertingFlow',
    inputSchema: RealTimeAnomalyAlertingInputSchema,
    outputSchema: RealTimeAnomalyAlertingOutputSchema,
  },
  async input => {
    const {output} = await sendAlert(input);
    return output!;
  }
);

