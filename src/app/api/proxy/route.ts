export async function GET() {
  return Response.json({error:"External video proxy is disabled."},{status:403});
}
