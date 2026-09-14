# デプロイ手順(Vercel)

## 運用ルール: pushする前に必ず確認を取る

コード修正の流れはこれに固定する。

1. ローカルで修正する
2. ローカルで動作確認する(型チェック・ビルド・可能ならローカルサーバーでの実地確認)
3. 内容を報告し、**ユーザーからOKをもらう**
4. OKが出てから初めて `git commit` → `git push` する

**修正しただけで勝手にpushしない。** pushする前に一言確認を取ること。

## Git認証まわり

このリポジトリはWindows標準の「Git Credential Manager(GCM)」を無効化し、シンプルなファイル保存方式(`credential.helper=store`)に切り替えてある(`.git/config`にローカル設定済み)。理由: GCMだとpushのたびにアカウント選択のポップアップが出て、確認せずに進められないため。

- GitHubの認証エラー(403など)が出た場合は、`m.yasaka1975@gmail.com`のGitHubアカウントで新しいPersonal Access Tokenを発行し、`git credential approve`で保存し直す(トークンをURLに直接埋め込むとリークするので絶対にしない)
- **yk-serviceはm.yasaka1975@gmail.comのアカウントで管理する**。別アカウント(roadcar-spec等)がこのリポジトリの共同編集者になっていないか、心当たりがなければ時々確認する

## Environment Variables の場所

Vercelの画面はよく変わるので、迷ったらここを見る。

1. Vercelダッシュボード → 対象プロジェクト(`yk-service`)を開く
2. **プロジェクトのサイドバーに直接ある「Environment Variables」をクリック**
   (「Settings」タブの中の「Environments」ではない。そちらは本番/プレビュー/開発環境の"環境そのもの"を管理する別のページで、変数の追加はできない。紛らわしいので要注意)

## 必要な環境変数

値は`.env.local`(このリポジトリには含まれていない、ローカル専用ファイル)を参照するか、Claudeに聞けば教えてもらえる。**このファイルには実際の値は書かない。**

| 変数名 | 用途 |
|---|---|
| `SUPABASE_URL` | SupabaseプロジェクトのURL(旧`NEXT_PUBLIC_SUPABASE_URL`から移行。NEXT_PUBLIC_無しが正しい) |
| `SUPABASE_ANON_KEY` | Supabaseのanonキー(旧`NEXT_PUBLIC_SUPABASE_ANON_KEY`から移行) |
| `AUTH_SESSION_SECRET` | ログインセッションCookieの署名鍵(ランダム生成した固定値) |
| `AUTH_VIEW_LINK_SECRET` | 閲覧専用リンクの署名鍵(ランダム生成した固定値) |
| `AUTH_TOTP_SECRETS` | 書き込みログイン許可者のメール:Authenticator秘密鍵のペア(カンマ区切り) |
| `SUPABASE_WRITER_EMAIL` | サーバー専用Supabaseアカウントのメール(人間はログインしない) |
| `SUPABASE_WRITER_PASSWORD` | 同アカウントのパスワード |

旧`NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY`は削除してよい(ブラウザに公開される変数のため、使わなくなったら残さない)。

## 変更後

環境変数を追加・変更したら、Deploymentsタブから最新デプロイの「Redeploy」を実行しないと反映されない。

## 初回公開(2026-08-22)でハマった3つの原因

`https://yk-service.vercel.app`にアクセスしても真っ白/404になる場合、この3つを疑う。

1. **`public`フォルダが空だとビルド自体が失敗する**
   `No Output Directory named "public" found` というビルドエラーになる。空でもいいので何かファイル(`robots.txt`など)を置いておく。

2. **Settings → Deployment Protection → Vercel Authentication がONだとアプリの前にVercel自身のログイン壁が出る**
   これが有効だと、うちのアプリの`/login`にすらたどり着けず、`vercel.com/sso-api`にリダイレクトされる。Hobbyプランでは本番だけ除外する機能が無い(Pro限定)ので、基本はOFFにする。アクセス制御はこのアプリ自身(Authenticatorログイン・閲覧リンク)で行っている。

3. **Settings → Build and Deployment → Framework Preset が「Other」になっていると、Next.jsとして正しく動かない**
   これが一番の原因になりやすい。「Other」だとVercelはただの静的サイト扱いにしてしまい、ページもAPIルートも`proxy.ts`も機能しない。**「Next.js」に変更する**。変更したら必ずRedeployすること(設定を保存しただけでは、今動いているProduction環境には反映されない)。
