# Gerar o APK usando somente o celular

Este projeto já inclui uma automação do GitHub Actions. O celular só precisa enviar o projeto para um repositório do GitHub; o servidor do GitHub compila o APK.

## Passo a passo

1. Crie uma conta/login no GitHub.
2. Crie um repositório novo, por exemplo `para-voce-meu-amor`.
3. Envie **o conteúdo desta pasta `androidapp`** para o repositório (não crie uma pasta extra `androidapp` dentro dele).
4. Depois de enviar os arquivos, abra a aba **Actions** do repositório.
5. Escolha **Construir APK** e toque em **Run workflow** (se o push já tiver iniciado, aguarde a execução).
6. Quando ficar verde, abra a execução concluída.
7. Na parte **Artifacts**, toque em **Para-voce-meu-amor-APK** para baixar o ZIP do APK.
8. Extraia o ZIP e instale `app-debug.apk` no Android.

## Atualizações futuras do conteúdo

O catálogo fica em `app/src/main/assets/content/manwhas.json` e o app também tenta atualizar esse catálogo pela URL pública configurada no `MainActivity.java`.

Assim, alterações no catálogo podem ser feitas sem alterar o núcleo do aplicativo. Alterações no código/engine exigem nova compilação.

## Observação

A compilação acontece nos servidores do GitHub Actions. O celular não precisa ter Android Studio, Gradle ou Android SDK instalados.
