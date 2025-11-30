import client from 'prom-client';

client.collectDefaultMetrics();

export async function GET() {
  const metrics = await client.register.metrics();
  return new Response(metrics, {
    status: 200,
    headers: { 'Content-Type': client.register.contentType },
  });
}
