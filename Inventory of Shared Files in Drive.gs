/*
* A Google Script to be run as a Custom Function in a Sheet that
* finds all files that are shared and
* displays the file's: name, URL, access, viewers' email addresses, editors' email addresses
* https://developers.google.com/apps-script/guides/sheets/functions
*/
function catalogDrive() {

  var files = DriveApp.getFiles();
  var sharedFiles = new Array();

  while (files.hasNext()) {
    var file = files.next();

    var listOfEditors = (file.getEditors().length > 0) ? file.getEditors().map(it => it.getEmail()).toString() : "";
    var listOfViewers = (file.getViewers().length > 0) ? file.getViewers().map(it => it.getEmail()).toString() : "";

    if (listOfEditors.length || listOfViewers.length) {
      var sharingAccess;
      try {
        sharingAccess = file.getSharingAccess();
      } catch (err) {
        sharingAccess = "ERROR";
      }
      sharedFiles.push(
        [
          file.getName(),
          file.getUrl(),
          sharingAccess,
          listOfViewers.toString(),
          listOfEditors.toString()
        ]
      );
    }
  }
  
  /* Display the results */
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  sheet.setName("Shared Files");
  sheet.appendRow(["file name", "URL", "Sharing", "Editors", "Viewers"]);
  sheet.setFrozenRows(1);

  sheet.getRange(2, 1, sharedFiles.length, 5).setValues(sharedFiles);
}
