import { ConvexHttpClient } from 'convex/browser';

let convexClient: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error(
        'NEXT_PUBLIC_CONVEX_URL environment variable is not set. ' +
        'Make sure it is defined in your .env file with the format: ' +
        'NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud'
      );
    }
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}
