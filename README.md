# bits4kids-Bot

<div align="center">
    <p>
        <a href="https://bits4kids.at/">
            <img alt="bits4kids Logo" src="https://www.koala-online.at/wp-content/uploads/2021/07/bits4kids_Logo_color@3x.png" width="200"/>
        </a>
    </p>
    <br>
    <p>
        <a href="https://bits4kids.at/">
            <img alt="bits4kids Website" src="https://img.shields.io/badge/bits4kids-Website-blue"/>
        </a>
        <a href="https://www.koala-online.at/">
            <img alt="KOALA-online Website" src="https://img.shields.io/badge/KOALA-Website-blue"/>
        </a>
    </p>
</div>

## About

The bits4kids-Discord bot helps *Coding Trainers* manage *Online Coding Clubs* on the bits4kids-Discord Server.

### Features

- Auto-Role-Assignment based on invites
- XP and level system
- VoiceLog system: Attendance tracking
- Offer a simplified experience for Discord beginners
- Various fun commands

## Setup Guide

1. Clone this repository using git
1. Install [Node.js](https://nodejs.dev/)
1. Run `npm install` in the project folder
1. Copy `config.sample.json` to `config.json`
1. Configure all options in `config.json`
    - To get your Discord token, you will need to create [a new Discord application](https://discord.com/developers/applications)
    - To obtain an OpenWeatherMap API key, you will need [an account](https://discord.com/developers/applications) on their site
1. Copy `badgeLevelconfig.sample.json` to `badgeLevelconfig.json`
1. Configure all options in `badgeLevelconfig.json` as preferred
    - To create custom badges, an image file has to be placed in the `badges` folder and its filename referenced in the `fileName` property
    - For each guild, a set of roles corresponding to the badges should be created. For each badge object, rename the property name(s) of the `roleIDs` object to the guild ID(s). Then, the ID of each role has to be referenced in the guild ID property of the `roleIDs` object of the corresponding badge object.
    - The badge name and level hurdle for each badge can be chosen freely
    - There is no limitations in the amount of badges
    - The badges do not have to be in any specific order
1. Run the bot using `node index.js`
