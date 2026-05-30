import { AuthConfig } from "convex/server";

export default {
    providers: [
        {
            domain: "https://trusty-panda-90.clerk.accounts.dev",
            applicationID: "convex",
        },
    ]
} satisfies AuthConfig;
