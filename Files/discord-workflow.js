const fs = require("fs");

const EventName = process.env.GITHUB_EVENT_NAME;
const Author = process.env.GITHUB_ACTOR;
const AuthorAvatar = process.env.GITHUB_AVATAR_URL;
const Repo = process.env.GITHUB_REPOSITORY;

const Event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));

const EventTargetType = process.env.GITHUB_REF;
const EventTargetName = process.env.GITHUB_REF_TYPE;

function GetEmbed() {
    const data = {
        Title: null,
        Description: null,
        Color: null,
        Other: []
    }

    SetData(data);


    const embed = {
        username: `GitHub: ${Author}`,
        avatar_url: AuthorAvatar,
        embeds: [
            {
                author: {
                    name: Repo
                },
                title: data.Title,
                description: data.Description,
                fields: data.Other,
                color: data.Color,
                timestamp: new Date().toISOString()
            }
        ]
    };

    return embed;
}



function SetData(data) {
    // #region DECLARATIONS

    const PUSH = "push", // commit
        PULL_REQUEST = "pull_request", // dowolny PR
        PULL_REQUEST_TARGET = "pull_request_target", // PR z oryginalnego repo
        CREATE = "create", // branch, tag, release
        DELETE = "delete", // branch, tag
        WORKFLOW_DISPATCH = "workflow_dispatch", // ręczne uruchomienie workflow
        ISSUES = "issues", // Każde zdarzenie związane z issues (otwarcie, zamknięcie, komentarz)
        MEMBER = "member", // Dodanie/usunięcie członka do repo.
        RELEASE = "release"; // Tworzenie, publikacja lub edycja release.


    const COLOR_CREATE = 0x00FF00, // zielony
        COLOR_MODIFY = 0xFFFF00, // żółty
        COLOR_DELETE = 0xFF0000, // czerwony
        COLOR_ATTENTION = 0xFF00FF, // magenta
        COLOR_INFO = 0x0000FF, // niebieski
        COLOR_IMPORTANT = 0xFFFFFF; // biały
    // #endregion

    // temporary
    let title, description, color, third, big, temp;

    function GetLink(first, second = null, third = null)
    {
        let link = "https://github.com";

        link += `/${first}`;

        if (second)
        {
            link += `/${second}`;

            if (third)
            {
                link += `/${third}`;
            }
        }

        return link;
    }
    function GetBranchLink()
    {
        return GetLink(Repo, "tree", EventTargetType.replace("refs/heads/", ""));
    }

    function Comment(text, link)
    {
        return `[${text}]( ${link} )`;
    }

    switch (EventName) {
        case PUSH:
            data.Title = "Push Commit";
            data.Description = `Użytkownik \`${Author}\` zrobił **push** w repozytorium \`${Repo}\` w branchu \`${EventTargetType}\``;
            data.Color = COLOR_IMPORTANT;
            data.Other = [
                {
                    name: "> ```REPOZYTORIUM```",
                    value: Comment(Repo, GetLink(Repo)),
                    inline: true
                },
                {
                    name: "> ```BRANCH```",
                    value: Comment(EventTargetName, GetBranchLink()),
                    inline: true
                },
                {
                    name: "> ```ILOŚĆ COMMITÓW```",
                    value: Event.commits.length,
                    inline: true
                },

                {
                    name: "```                              TREŚĆ                              ```",
                    value: Comment("Porównanie nowego brancha z bazowym", GetLink(Repo, "compare", `${Event.before}...${Event.after}`)),
                    inline: false
                }
            ];

            break;
        case PULL_REQUEST_TARGET: // [opened, reopened, closed, edited, assigned, ready_for_review]

            switch (Event.action) {
                case "opened":
                case "reopened":
                    title = "Pull Request (Target) - otwarcie";
                    description = `Użytkownik \`${Author}\` otworzył pull request #\`${Event.pull_request.number}\` w repozytorium \`${Repo}\` o tytule **${Event.pull_request.title || "*Brak tytułu*"}**`;
                    color = COLOR_CREATE;
                    break;
                case "closed":
                    title = "Pull Request (Target) - zamknięcie";
                    description = `Użytkownik \`${Author}\` zamknął pull request #\`${Event.pull_request.number}\` w repozytorium \`${Repo}\` o tytule **${Event.pull_request.title || "*Brak tytułu*"}**`;
                    color = COLOR_INFO;
                    break;
                case "edited":
                    title = "Pull Request (Target) - modyfikacja";
                    description = `Użytkownik \`${Author}\` zedytował pull request #\`${Event.pull_request.number}\` w repozytorium \`${Repo}\` o tytule **${Event.pull_request.title || "*Brak tytułu*"}**`;
                    color = COLOR_MODIFY;
                    break;
                case "assigned":
                    title = "Pull Request (Target) - przydzielenie";
                    description = `Użytkownik \`${Author}\` przydzielił pull request #\`${Event.pull_request.number}\` w repozytorium \`${Repo}\` o tytule **${Event.pull_request.title || "*Brak tytułu*"}** do użytkownika \`${Event.assignee.login}\``;
                    color = COLOR_INFO;

                    third = {
                        name: "> ```NOWY PRZYDZIAŁ```",
                        value: Comment(Event.assignee.login, GetLink(Event.assignee.login)),
                        inline: true
                    }

                    break;
                case "ready_for_review":
                    title = "Pull Request (Target) - gotowy do przeglądu";
                    description = `Użytkownik \`${Author}\` oznaczył pull request #\`${Event.pull_request.number}\` w repozytorium \`${Repo}\` o tytule **${Event.pull_request.title || "*Brak tytułu*"}** jako gotowy do przeglądu`;
                    color = COLOR_ATTENTION;
                    break;
                default:
                    process.exit(0);
                    break;
            }

            data.Title = title;
            data.Description = description;
            data.Color = color;
            data.Other = [
                {
                    name: "> ```REPOZYTORIUM```",
                    value: Comment(Repo, GetLink(Repo)),
                    inline: true
                },
                {
                    name: "> ```PULL REQUEST```",
                    value: `[#${Event.pull_request.number}: ${Event.pull_request.title || "*Brak tytułu*"}]( ${Event.pull_request.html_url} )`,
                    inline: true
                },
                {
                    name: "> ```BRANCHE```",
                    value: `${Event.pull_request.head.ref} -> ${Event.pull_request.base.ref}`,
                    inline: true
                },

                {
                    name: "> ```INSPEKTORZY```",
                    value: (() => {
                        let result = "";
                        Event.pull_request.requested_reviewers.forEach(reviewer => {
                            result += `- [${reviewer.login}]( ${GetLink(reviewer.login)} )\n`;
                        });

                        return result || "Brak inspektorów";
                    })(),
                    inline: true
                }
            ];

            if (third)
                data.Other.push(third);

            data.Other.push({
                name: "```                              TREŚĆ                              ```",
                value: Event.pull_request.body || "Brak treści",
                inline: false
            });

            break;
        case CREATE:
            switch (EventTargetName) {
                case "branch":
                    title = "Utworzenie - Branch";
                    description = `Użytkownik \`${Author}\` utworzył branch **${EventTargetType}** w repozytorium \`${Repo}\``;
                    break;

                case "tag":
                    title = "Utworzenie - Tag";
                    description = `Użytkownik \`${Author}\` utworzył tag **${Event.ref}** w repozytorium \`${Repo}\``;
                    break;

                default:
                    process.exit(0);
                    return;
            };

            data.Title = title;
            data.Description = description;
            data.Color = COLOR_CREATE;
            data.Other = [
                {
                    name: "> ```REPOZYTORIUM```",
                    value: Comment(Repo, GetLink(Repo)),
                    inline: true
                },
                {
                    name: "> ```NAZWA```",
                    value: Comment(Event.ref, GetLink(Repo, "release", Event.ref)),
                    inline: true
                }
            ];

            break;
        case DELETE:
            switch (Event.ref_type) {
                case "branch":
                    title = "Usunięcie - Branch";
                    description = `Użytkownik \`${Author}\` usunął branch *${EventTargetType}**`
                    break;

                case "tag":
                    title = "Usunięcie - Tag";
                    description = `Użytkownik \`${Author}\` usunął tag **${Event.ref}**`
                    break;

                default:
                    title = "NIEZNANE `delete`";
                    description = EventTargetName;
                    break;
            }

            data.Title = title;
            data.Description = description;
            data.Color = COLOR_DELETE;

            data.Other = [
                {
                    name: "> ```REPOZYTORIUM```",
                    value: Comment(Repo, GetLink(Repo)),
                    inline: true
                },
                {
                    name: "> ```NAZWA```",
                    value: Comment(Event.ref, GetLink(Repo, "release", Event.ref)),
                    inline: true
                }
            ];

            break;
        case WORKFLOW_DISPATCH:
            data.Title = `Uruchomienie Workflow`;
            data.Description = `Użytkownik \`${Author}\` uruchomił workflow **${process.env.GITHUB_WORKFLOW || "Nieznane"}**`;
            data.Color = COLOR_ATTENTION;
            data.Other = [
                {
                    name: "> ```REPOZYTORIUM```",
                    value: Comment(Repo, GetLink(Repo)),
                    inline: true
                },
                {
                    name: "> ```WORKFLOW```",
                    value: Comment(process.env.GITHUB_WORKFLOW || "Nieznane", GetLink(Repo, "actions/workflows/runs", process.env.GITHUB_RUN_ID)),
                    value: process.env.GITHUB_WORKFLOW || "Nieznane",
                    inline: true
                }
            ];

            break;
        case ISSUES:
            switch (Event.action) {
                case "opened":
                case "reopened":
                    title = "Problem - otwarcie";
                    description = `Użytkownik \`${Author}\` otworzył problem #\`${Event.issue.number}\` w repozytorium \`${Repo}\` o tytule **[${Event.issue.title}]( https://github.com/${Repo}/issues/${Event.issue.number} )**`;
                    color = COLOR_CREATE;

                    big = {
                        name: "```                              TREŚĆ                              ```",
                        value: Event.issue.body || "Brak treści",
                        inline: false
                    }

                    break;

                case "edited":
                    title = "Problem - modyfikacja";
                    description = `Użytkownik \`${Author}\` zedytował problem #\`${Event.issue.number}\` w repozytorium \`${Repo}\` o tytule **${Event.issue.title}** )`;
                    color = COLOR_MODIFY;

                    big = {
                        name: "```                              TREŚĆ                              ```",
                        value: Event.issue.body || "Brak treści",
                        inline: false
                    };

                    break;

                case "closed":
                    title = "Problem - zamknięcie";
                    description = `Użytkownik \`${Author}\` zamknął problem #\`${Event.issue.number}\` w repozytorium \`${Repo}\` o tytule **${Event.issue.title}**`;
                    color = COLOR_INFO;

                    break;

                case "assigned":
                    title = "Problem - przydzielenie";
                    description = `Użytkownik \`${Author}\` przydzielił problem #\`${Event.issue.number}\` w repozytorium \`${Repo}\` o tytule **${Event.issue.title}** do użytkownika \`${Comment(Event.assignee.login, GetLink(Event.assignee.login))}\``;
                    color = COLOR_INFO;

                    break;

                case "deleted":
                    title = "Problem - usunięcie";
                    description = `Użytkownik \`${Author}\` usunął problem #\`${Event.issue.number}\` w repozytorium \`${Repo}\` o tytule **${Event.issue.title}** )`
                    color = COLOR_DELETE;

                    third = false;
                    break;

                default:
                    process.exit(0);
                    return;
            }

            data.Title = title;
            data.Description = description;
            data.Color = color;
            data.Other = [
                {
                    name: "> ```REPOZYTORIUM```",
                    value: Comment(Repo, GetLink(Repo)),
                    inline: true
                },
                {
                    name: "> ```BRANCH```",
                    value: Comment(EventTargetName, GetBranchLink()),
                    inline: true
                },
                {
                    name: "> ```TYP```",
                    value: (() => {
                        let result = "";
                        Event.issue.labels.forEach(label => {
                            result += `- ${label.name}\n`;
                        });

                        return result;
                    })(),
                    inline: true
                },
                {
                    name: "> ```PRZYDZIELENI```",
                    value: (() => {
                        let result = "";
                        Event.issue.assignees.forEach(assignee => {
                            result += `- [${assignee.login}]( ${GetLink(assignee.login)} )`;
                        })

                        return result;
                    })(),
                    inline: true
                }
            ];

            if (third !== false)
            {
                data.Other.push({
                    name: "> ```LINK```",
                    value: Comment(`#${Event.issue.number}: ${Event.issue.title}`, GetLink(Repo, "issues", Event.issue.number)),
                    inline: true
                });
                data.Other.push({
                    name: "```                              TREŚĆ                              ```",
                    value: Event.issue.body || "Brak treści",
                    inline: false
                });
            }

            if (big)
                data.Other.push(big);

            break;
        case MEMBER:

            switch (Event.action) {
                case "added":
                    title = "Członek - Dodanie";
                    description = `Użytkownik \`${Author}\` dodał członka **${Event.member.login}** do repozytorium \`${Repo}\``;
                    color = COLOR_CREATE;
                    break;

                case "removed":
                    title = "Członek - Usunięcie";
                    description = `Użytkownik \`${Author}\` usunął członka **${Event.member.login}** z repozytorium \`${Repo}\``;
                    color = COLOR_DELETE;
                    break;

                case "edited":
                    title = "Członek - Zmiana";
                    description = `Użytkownik \`${Author}\` zedytował członka **${Event.member.login}** w repozytorium \`${Repo}\``;
                    color = COLOR_MODIFY;

                    big = {
                        name: "> ```                              PERMISJE                              ```",
                        value: `\`${Event.changes.permission.from || "Brak"}\` -> \`${Event.member.permission || "Brak"}\``,
                        inline: false
                    }

                    break;

                default:
                    title = "member Nieznane";
                    description = `Nieznana akcja od \`${Author}\``;
                    color = COLOR_EMERGENCY;
                    break;
            }

            data.Title = title;
            data.Description = description;
            data.Color = color;
            data.Other = [
                {
                    name: "> ```REPOZYTORIUM```",
                    value: Comment(Repo, GetLink(Repo)),
                    inline: true
                },
                {
                    name: "> ```UŻYTKOWNIK (którego dotyczy)```",
                    value: `**[${Event.member.login}]( https://github.com/${Event.member.login} )**\nID: \`${Event.member.id}\``,
                    inline: true
                },
                {
                    name: "> ```PERMISJE```",
                    value: Event.member.permission,
                    inline: true
                }
            ];

            if (big)
                data.Other.push(big);

            break;
        case RELEASE:

            switch (Event.action) {
                case "published":
                    title = "Wydanie - Publikacja";
                    description = `Użytkownik \`${Author}\` opublikował wydanie **${Event.release.tag_name}** w repozytorium \`${Repo}\``;
                    color = COLOR_IMPORTANT;

                    break;

                case "created":
                    title = "Wydanie - Utworzenie";
                    description = `Użytkownik \`${Author}\` utworzył wydanie **${Event.release.tag_name}** w repozytorium \`${Repo}\``;
                    color = COLOR_CREATE;

                    break;

                case "edited":
                    title = "Wydanie - Modyfikacja";
                    description = `Użytkownik \`${Author}\` zedytował wydanie **${Event.release.tag_name}** w repozytorium \`${Repo}\``;
                    color = COLOR_MODIFY;

                    break;

                case "deleted":
                    title = "Wydanie - Usunięcie";
                    description = `Użytkownik \`${Author}\` usunął wydanie **${Event.release.tag_name}** w repozytorium \`${Repo}\``;
                    color = COLOR_DELETE;

                    big = false;

                    break;

                case "prereleased":
                    title = "Wydanie - Prerelease"
                    description = `Użytkownik \`${Author}\` utworzył prerelease **${Event.release.tag_name}** w repozytorium \`${Repo}\``;
                    color = COLOR_ATTENTION;

                    break;

                default:
                    process.exit(0);
                    break;
            }


            data.Title = title;
            data.Description = description
            data.Color = color;
            data.Other = [
                {
                    name: "> ```REPOZYTORIUM```",
                    value: Comment(Repo, GetLink(Repo)),
                    inline: true
                },
                {
                    name: "> ```TYTUŁ```",
                    value: `[${Event.release.name || "Brak tytułu"}]( ${Event.release.html_url} )`,
                    inline: true
                },
            ];

            if (big !== false)
                data.Other.push({
                    name: "```                              TREŚĆ                              ```",
                    value: Event.release.body || "Brak treści",
                    inline: false
                });
            break;
        default:
            data.Title = "Nieznane";
            data.Description = "Nieznana akcja";
            data.Color = COLOR_EMERGENCY;
            data.Other = [
                {
                    name: "> ```AKCJA```",
                    value: EventName,
                    inline: true
                },
                {
                    name: "> ```REPOZYTORIUM```",
                    value: Comment(Repo, GetLink(Repo)),
                    inline: true
                },
                {
                    name: "> ```UŻYTKOWNIK```",
                    value: GetLink(Author, GetLink(Author)),
                    inline: true
                }
            ];

            break;
    }
}


const https = require("https");
const url = process.env.DISCORD_WEBHOOK_URL;
const options = new URL(url);

const data = JSON.stringify(GetEmbed());
const req = https.request({
    hostname: options.hostname,
    path: options.pathname + options.search,
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
    }
}, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.on("data", d => process.stdout.write(d));
});




req.write(data);
req.end();
