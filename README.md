# POLENCA Notes

Um bloco de notas privado para casais.

## Rodar localmente

Requisitos: Node.js 20 ou superior.

1. Instale as dependências com `npm install`.
2. Configure o projeto Firebase usado pelo aplicativo em `src/lib/firebase.ts`.
3. Publique as regras de `firestore.rules` no Firestore.
4. Inicie com `npm run dev`.

## Build

`npm run build`

## Segurança

As regras do Firestore limitam o acesso aos dados do próprio casal.

Notas privadas ficam disponíveis somente para quem criou a nota.

Códigos de convite usam 8 caracteres gerados com `crypto.getRandomValues`.
