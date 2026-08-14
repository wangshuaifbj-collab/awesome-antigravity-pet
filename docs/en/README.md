# Awesome Codex Pet Docs

[简体中文](../zh-CN/README.md) | [한국어](../ko/README.md) | [日本語](../ja/README.md) | [Español](../es/README.md) | English

English documentation for Awesome Codex Pet.

## Index

- [Submission Guide](./submission-guide.md)
- [Repository Structure](./repository-structure.md)
- [Categories](./categories.md)
- [Contributing](./CONTRIBUTING.md)

## Common Commands

Install a pet without cloning this repository:

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://raw.githubusercontent.com/legeling/awesome-codex-pet/main/scripts/install-pet.sh | bash -s -- --raw-base https://raw.githubusercontent.com/legeling/awesome-codex-pet/main mikoto--lingxiaotian
```

List available pets:

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://raw.githubusercontent.com/legeling/awesome-codex-pet/main/scripts/install-pet.sh | bash -s -- --raw-base https://raw.githubusercontent.com/legeling/awesome-codex-pet/main --list
```

Repository maintenance commands:

```bash
npm install
python -m pip install -r requirements.txt
npm run previews
npm run validate
npm run lint
```
