import fs from "fs";
import path from "path";

const SCRIPT_NAME = "anonhost";
const INSTALL_DIR = "$HOME/.local/bin";

const actualScriptContent = fs.readFileSync(
  path.join(process.cwd(), "src/lib/install.sh"),
  "utf-8",
);

const installerScriptTemplate = `#!/bin/bash

set -e

SCRIPT_NAME="${SCRIPT_NAME}"
INSTALL_DIR="${INSTALL_DIR}"
INSTALL_PATH="\$INSTALL_DIR/\$SCRIPT_NAME"

echo_color() {
  local color_code="\$1"
  shift
  if [ -t 1 ]; then # Check if stdout is a terminal
    printf '%s%s%s\\n' "\$color_code" "\$*" "\$(tput sgr0)"
  else
    printf '%s\\n' "\$*" # Print without color if not a terminal
  fi
}

echo_green() { echo_color "\$(tput setaf 2)" "\$@"; }
echo_yellow() { echo_color "\$(tput setaf 3)" "\$@"; }
echo_bold() { echo_color "\$(tput bold)" "\$@"; }

echo "Creating installation directory if it doesn't exist: \$INSTALL_DIR"
mkdir -p "\$INSTALL_DIR"

echo "Installing \$SCRIPT_NAME to \$INSTALL_PATH..."
cat << 'EOF' > "\$INSTALL_PATH"
${actualScriptContent.trim()}
EOF

echo "Making \$SCRIPT_NAME executable..."
chmod +x "\$INSTALL_PATH"

echo_green "\$SCRIPT_NAME installed successfully to \$INSTALL_PATH"
echo ""
if [[ ":\$PATH:" != *":\$INSTALL_DIR:"* ]]; then
  echo_yellow "Warning: Installation directory \$INSTALL_DIR is not in your PATH."
  echo "You might need to add it. Add one of the following lines to your shell profile (e.g., ~/.bashrc, ~/.zshrc):"
  echo ""
  echo_bold "  export PATH=\\"\$INSTALL_DIR:\\\$PATH\\""
  echo ""
  echo "Then, restart your shell or run:"
  echo_bold "  source ~/.bashrc  # (or ~/.zshrc, etc.)"
  echo ""
  echo "Alternatively, you can run the script using the full path:"
  echo_bold "  \$INSTALL_PATH <command>"
else
  echo "Installation directory is in your PATH."
  echo "You can now run the script using:"
  echo_bold "  \$SCRIPT_NAME <command>"
fi

echo ""
echo_green "Installation complete!"
`;

export async function GET() {
  return new Response(installerScriptTemplate, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
