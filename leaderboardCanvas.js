const canvacord = require("canvacord");

class LeaderboardCanvas extends canvacord.Builder {
    constructor() {
        super(930,280);
        this.bootstrap({
            displayname: "",
            type: "welcome",
            avatar: "",
            message: "",
        });
    }

    setDisplayName(value) {
        this.options.set("displayName", value);
        return this;
    }

    setType(value) {
        this.options.set("type", value);
        return this;
    }

    setAvatar(value) {
        this.options.set("avatar", value);
        return this;
    }

    setMessage(value) {
        this.options.set("message", value);
        return this;
    }

    async render() {
        const { type, displayName, avatar, message } = this.options.getOptions();
    
        const image = await canvacord.loadImage(avatar);
    
        return canvacord.JSX.createElement(
            "div",
            {
                className: "h-full w-full flex flex-col items-center justify-center bg-[#23272A] rounded-xl",
            },
            canvacord.JSX.createElement(
                "div",
                {
                    className: "px-6 bg-[#2B2F35AA] w-[96%] h-[84%] rounded-lg flex items-center",
                },
                canvacord.JSX.createElement("img", {
                    src: image.toDataURL(),
                    className: "flex h-[40] w-[40] rounded-full",
                }),
                canvacord.JSX.createElement(
                    "div",
                    {
                        className: "flex flex-col ml-6"
                    },
                    canvacord.JSX.createElement(
                        "h1",
                        {
                            className: "text-5xl text-white font-bold m-0"
                        },
                        type === "welcome" ? "Welcome" : "Goodbye",
                        ",",
                        " ",
                        canvacord.JSX.createElement(
                            "span",
                            {
                                className: "text-blue-500"
                            },
                            displayName,
                            "!"
                        )
                    ),
                    canvacord.JSX.createElement(
                        "p",
                        {
                            className: "text-gray-300 text-3xl m-0"
                        },
                        message
                    )
                )
            )
        );
    }
}

module.exports = { LeaderboardCanvas };