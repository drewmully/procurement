export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page gets a clean layout without sidebar/header
  return <>{children}</>;
}
