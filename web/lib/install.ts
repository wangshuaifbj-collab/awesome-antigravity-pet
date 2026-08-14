export const INSTALL_PLACEHOLDER = "<pet-slug--author-slug>";
const requestedInstallRef =
  process.env.NEXT_PUBLIC_INSTALL_REF?.trim() || "main";
if (
  !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(requestedInstallRef) ||
  requestedInstallRef.includes("..")
) {
  throw new Error("NEXT_PUBLIC_INSTALL_REF contains unsafe characters");
}
const installRef = requestedInstallRef;
const installRawBase = `https://raw.githubusercontent.com/legeling/awesome-codex-pet/${installRef}`;

export const BASH_INSTALL_COMMAND =
  `curl -fsSL --proto '=https' --tlsv1.2 ${installRawBase}/scripts/install-pet.sh | bash -s -- --raw-base ${installRawBase} ` +
  INSTALL_PLACEHOLDER;

export const POWERSHELL_INSTALL_COMMAND = `powershell -NoProfile -ExecutionPolicy Bypass -Command "iwr -UseB -MaximumRedirection 5 -TimeoutSec 120 ${installRawBase}/scripts/install-pet.ps1 | iex; Install-CodexPet ${INSTALL_PLACEHOLDER} -RawBase '${installRawBase}'"`;

export const LOCAL_INSTALL_COMMAND = `npm run install:pet -- ${INSTALL_PLACEHOLDER}`;

export function getPetInstallCommands(slug: string) {
  return {
    bash: BASH_INSTALL_COMMAND.replace(INSTALL_PLACEHOLDER, slug),
    powershell: POWERSHELL_INSTALL_COMMAND.replace(INSTALL_PLACEHOLDER, slug),
  };
}
