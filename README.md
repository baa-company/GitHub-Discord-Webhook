# Krótki opis
Te repozytorium zawiera gotowe pliki do tworzenia systemu logów na Discordzie.

# Jak użyć?
1. Skopiuj pliki z folderu **[Files]( ./Files )**, a następnie wklej je do swojego repozytorium na ścieżkę `.github/workflows/`.
2. Wejdź w `Settings` repozytorium.
3. Wejdź w kategorię `Secrets and variables`.
4. Wejdź w `Actions`.
5. W `Environment secrets` wciśnij `Manage environment secrets`.
6. Wejdź w `DiscordWebhook`.
7. Na dole wciśnij w `Add envorinment secret`.
8. Nazwij go **`DISCORD_WEBHOOK_URL`** i wklej jako wartość link do [Webhooka Discord](#dscweb).

# <a name="dscweb">Jak stworzyć Webhooka na Discordzie?</a>
1. Wejdź w ustawienia kanału.
2. `Integracje`.
3. `Webhooki`.
4. `Nowy webhook`.
5. `Skopiuj adres URL webhooka`.
