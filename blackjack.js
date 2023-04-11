const Discord = require("discord.js");

class Karte {
  constructor(farbe, wert) {
    this.farbe = farbe;
    this.wert = wert;
  }
  toString() {
    return this.farbe + this.wert;
  }
}

const farben = ["♠", "♣", "♥", "♦"];
const werte = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

module.exports = class Blackjack {
  /**
   * @param {Discord.Message} msg
   */
  constructor(msg, endCallback) {
    this.msg = msg;
    this.endCallback = endCallback;

    this.editMsg = null;
    this.permissionManageMsg = msg.guild && msg.channel
      .permissionsFor(msg.guild.me)
      .has(Discord.Permissions.FLAGS.MANAGE_MESSAGES);
    this.spielerKarten = [];
    this.dealerKarten = [];
    this.deck = [];
    this.optionen = [];
  }

  start() {
    this.deck = [];
    farben.forEach((f) => {
      werte.forEach((w) => {
        this.deck.push(new Karte(f, w));
      });
    });
    this.mischen();
    this.spielerKarten.push(this.deck.shift());
    this.dealerKarten.push(this.deck.shift());
    this.spielerKarten.push(this.deck.shift());
    this.dealerKarten.push(this.deck.shift());
    this.anzeigen();
  }

  async sendMessage(text) {
    if (!this.editMsg || !this.permissionManageMsg) this.editMsg = await this.msg.reply(text);
    else this.editMsg.edit(text);
    return this.editMsg;
  }

  async anzeigen() {
    let summeSpieler = this.score(this.spielerKarten);
    let nachricht =
      "Um Blackjack zu beenden, schreibe +blackjack end.\nDas sind deine Karten:";
    nachricht += this.spielerKarten.join(" ") + "\n";
    nachricht += "Deine Summe: " + summeSpieler + "\n";
    nachricht += "Das sind die Karten des Dealers:\n";
    nachricht += this.dealerKarten[0] + " ❔\n";
    nachricht += "➕ = Hit, ➖ = Stand";
    this.options(await this.sendMessage(nachricht));
  }

  anzeigenDealer() {
    let summeSpieler = this.score(this.spielerKarten);
    let summeDealer = this.score(this.dealerKarten);
    let nachricht = "";
    nachricht += this.spielerKarten.join(" ") + "\n";
    nachricht += "Deine Summe: " + summeSpieler + "\n";
    nachricht += "Das sind die Karten des Dealers:\n";
    nachricht += this.dealerKarten.join(" ") + "\n";
    nachricht += "Das ist die Summe des Dealers: " + summeDealer;
    this.sendMessage(nachricht);
  }

  mischen() {
    let i = this.deck.length,
      j,
      mische;
    while (--i) {
      j = Math.floor(Math.random() * (i + 1));
      mische = this.deck[i];
      this.deck[i] = this.deck[j];
      this.deck[j] = mische;
    }
  }

  canSplit() {
    if (
      this.spielerKarten.length === 2 &&
      this.spielerKarten[0].wert === this.spielerKarten[1].wert
    ) {
      return true;
    } else {
      return false;
    }
  }

  score(cards) {
    let ass = false;
    let summe = 0;
    for (let i = 0, punkte; i < cards.length; i++) {
      if (
        cards[i].wert === "J" ||
        cards[i].wert === "Q" ||
        cards[i].wert === "K"
      ) {
        punkte = 10;
      } else if (cards[i].wert === "A") {
        ass = true;
        punkte = 1;
      } else {
        punkte = parseInt(cards[i].wert);
      }
      summe += punkte;
    }
    if (ass && summe < 12) {
      summe += 10;
    }
    return summe;
  }

  options(reactMsg) {
    let hit = false;
    let blackjack = false;
    let stand = false;
    let summe = this.score(this.spielerKarten);
    if (summe < 21) {
      hit = true;
      stand = true;
      reactMsg.react("➕");
      reactMsg.react("➖");
      const filter = (reaction, user) =>
        (reaction.emoji.name === "➕" || reaction.emoji.name === "➖") &&
        user.id === this.msg.author.id;
      this.collector = reactMsg.createReactionCollector({
        filter, 
        time: 30000,
        max: 1,
        dispose: true,
      });
      this.collector.on("collect", (r) => {
        switch (r.emoji.toString()) {
          case "➕":
            this.hit(this.spielerKarten);
            this.anzeigen(true);
            break;
          case "➖":
            this.dealer();
            break;
          default:
            console.log("Das darf nicht passieren");
        }
        if (this.permissionManageMsg) r.users.remove(this.msg.author);
      });
      this.collector.on("end", (collected, reason) => {
        if (reason === "blackjack end") return;
        if (collected.size === 0) {
          this.msg.reply("Entschuldigung, aber du hast zu lange überlegt.");
          this.end();
          return;
        }
      });
    }
    if (summe === 21) {
      blackjack = true;
      this.msg.reply("Kongratulation! Du hast einen Blackjack.");
      this.anzeigenDealer();
      this.end();
      return;
    }
    if (summe >= 22) {
      this.dealer();
      return;
    }
  }

  hit(cards) {
    cards.push(this.deck.shift());
  }

  dealer() {
    while (this.score(this.dealerKarten) <= 16) {
      this.hit(this.dealerKarten);
      this.anzeigenDealer();
    }
    if (this.score(this.dealerKarten) >= 17) {
      this.gewinner();
    }
  }

  gewinner() {
    let spielerScore = this.score(this.spielerKarten);
    let dealerScore = this.score(this.dealerKarten);
    if (spielerScore < dealerScore && dealerScore < 22) {
      this.msg.reply("Entschuldigung, aber du hast verloren. Der Dealer hatte die bessere Hand.");
    } else if (spielerScore > dealerScore && spielerScore < 22) {
      this.msg.reply("Kongratulation, du hast gewonnen! Du hattest die bessere Hand.");
    } else if (spielerScore >= 22 && dealerScore <= 21) {
      this.msg.reply("Entschuldigung, aber du hast verloren. Du hast dich überkauft.");
    } else if (dealerScore >= 22 && spielerScore <= 21) {
      this.msg.reply("Du hast gewonnen! Der Dealer hat sich überkauft.");
    } else if (
      spielerScore === dealerScore &&
      spielerScore <= 21 &&
      dealerScore <= 21
    ) {
      this.msg.reply("Unentschieden! Ihr beide habt den selben Wert.");
    } else if (spielerScore >= 22 && dealerScore >= 22) {
      this.msg.reply(
        "Du hast verloren, obwohl sowohl der Dealer als auch du sich überkauft haben."
      );
    } else {
      console.log(
        "Das darf nicht passieren!?!?!?!??!?!?!",
        spielerScore,
        dealerScore
      );
    }
    if (this.dealerKarten.length === 2) {
      this.anzeigenDealer();
    }
    this.end();
  }

  end() {
    if (this.collector) {
      this.collector.stop("blackjack end");
    }
    //this.msg.reply({ content: "Blackjack beendet.", allowedMentions: { repliedUser: false }});
    this.deck = [];
    this.endCallback();
  }
};
