// === Google Apps Script — Signature Locale Back Office ===
// Coller ce code dans Extensions > Apps Script de votre Google Sheet

var SHEET_NAME = "Feuille 1"; // Nom de l'onglet (adapter si besoin)

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    }

    var data = JSON.parse(e.postData.contents);

    // Ajouter la ligne dans le Sheet
    sheet.appendRow([
      new Date().toLocaleString("fr-CH"),
      data.name || "",
      data.business || "",
      data.email || "",
      data.phone || "",
      data.city || "",
      data.type || "",
      data.message || "",
      "Nouveau"
    ]);

    // Envoyer un email de notification
    var adminEmail = "contact@signaturelocale.ch"; // <-- MODIFIER avec votre email
    MailApp.sendEmail({
      to: adminEmail,
      subject: "Nouvelle demande — " + (data.business || "Sans nom"),
      htmlBody:
        "<h2>Nouvelle demande Signature Locale</h2>" +
        "<p><strong>Nom :</strong> " + (data.name || "-") + "</p>" +
        "<p><strong>Commerce :</strong> " + (data.business || "-") + "</p>" +
        "<p><strong>Email :</strong> " + (data.email || "-") + "</p>" +
        "<p><strong>Telephone :</strong> " + (data.phone || "-") + "</p>" +
        "<p><strong>Ville :</strong> " + (data.city || "-") + "</p>" +
        "<p><strong>Type :</strong> " + (data.type || "-") + "</p>" +
        "<p><strong>Message :</strong> " + (data.message || "-") + "</p>" +
        "<hr><p style='color:gray;font-size:12px;'>Gerez cette demande dans votre <a href='" +
        SpreadsheetApp.getActiveSpreadsheet().getUrl() + "'>Google Sheet</a></p>"
    });

    // Envoyer un email de confirmation au client
    if (data.email) {
      MailApp.sendEmail({
        to: data.email,
        subject: "Merci pour votre interet — Signature Locale",
        htmlBody:
          "<h2>Merci " + (data.name || "") + " !</h2>" +
          "<p>Nous avons bien recu votre demande concernant <strong>" + (data.business || "votre commerce") + "</strong>.</p>" +
          "<p>Notre equipe vous recontactera sous 48h.</p>" +
          "<br>" +
          "<p>Cordialement,<br><strong>L'equipe Signature Locale</strong></p>" +
          "<p style='color:gray;font-size:12px;'>Lausanne, Suisse</p>"
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// === Fonction pour envoyer un email de reponse depuis le Sheet ===
// Utilisation : selectionnez une ligne, puis menu "Signature Locale > Repondre"
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Signature Locale")
    .addItem("Repondre au commercant", "repondreAuCommercant")
    .addItem("Marquer comme traite", "marquerTraite")
    .addItem("Marquer comme en cours", "marquerEnCours")
    .addToUi();
}

function repondreAuCommercant() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = sheet.getActiveRange().getRow();

  if (row <= 1) {
    SpreadsheetApp.getUi().alert("Selectionnez une ligne de demande (pas l'en-tete).");
    return;
  }

  var name = sheet.getRange(row, 2).getValue();
  var business = sheet.getRange(row, 3).getValue();
  var email = sheet.getRange(row, 4).getValue();

  if (!email) {
    SpreadsheetApp.getUi().alert("Pas d'email pour cette demande.");
    return;
  }

  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    "Repondre a " + name + " (" + business + ")",
    "Ecrivez votre message :",
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    var messageText = result.getResponseText();

    MailApp.sendEmail({
      to: email,
      subject: "Signature Locale — Reponse a votre demande",
      htmlBody:
        "<h2>Bonjour " + name + ",</h2>" +
        "<p>" + messageText.replace(/\n/g, "<br>") + "</p>" +
        "<br>" +
        "<p>Cordialement,<br><strong>L'equipe Signature Locale</strong></p>" +
        "<p style='color:gray;font-size:12px;'>Lausanne, Suisse</p>"
    });

    // Mettre a jour le statut
    sheet.getRange(row, 9).setValue("Repondu");
    SpreadsheetApp.getUi().alert("Email envoye a " + email);
  }
}

function marquerTraite() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row > 1) {
    sheet.getRange(row, 9).setValue("Traite");
  }
}

function marquerEnCours() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row > 1) {
    sheet.getRange(row, 9).setValue("En cours");
  }
}