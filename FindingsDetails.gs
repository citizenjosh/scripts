/**
* Get finding details from BoostSecurity
* via GraphQL API and
* put them in a Google Sheet
*
* NOTE: to change the number of results, manually change the values in "variables" on line 59
*/

/**
 * Global Constants
 */
const API_URL = "https://api.boostsecurity.io/findings-view/graphql";
const API_KEY = PropertiesService.getScriptProperties().getProperty("apiKey");
const AUTHORIZATION_HEADER = "ApiKey " + API_KEY;
const SHEET_NAME = "BoostSecurity Finding Details";
const HEADERS = ["Finding ID", "Rule Name", "Scanner", "Suppression(s)", "URL"];

/**
 * Prepare the GraphQL query
 * @returns {string} The GraphQL query as a string
 */
function prepareQuery() {
  return JSON.stringify({
    query: `query (
    $filters: FindingsFiltersSchema,
    $first: Int,
    $after: String,
    $last: Int,
    $before: String,
    $page: Int,
    $locateFindingId: String
  ) {
    findings(
        filters: $filters,
        first: $first,
        after: $after,
        last: $last,
        before: $before,
        page: $page,
        locateFindingId: $locateFindingId    
   ) {
      edges {
        node {
          findingId
          ruleName
          analysisContext {
            analyzerName
          }
          suppressions {
            suppressionType
          }
          scmLink {
            href
          }
        }
      }
    }
  }`,
    variables: {
      "first": 3, // number of findings to retrieve
      "page": 1   // from which page of results to retrieve findings
    },
  });
}

/**
 * Fetch data from the API
 * @param {string} query - The GraphQL query to send to the API
 * @returns {object} The response from the API as a JavaScript object
 */
function fetchData(query) {
  let params = {
    method: "POST",
    payload: query,
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTHORIZATION_HEADER,
    },
  };
  
  try {
    var responseText = UrlFetchApp.fetch(API_URL, params).getContentText();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error fetching data from API: ", error);
    return null;
  }
}

/**
 * Parse the response from the API
 * @param {object} response - The response from the API
 * @returns {array} The parsed findings
 */
function parseResponse(response) {
  if (response && response.data && response.data.findings) {
    return response.data.findings.edges.map(f => f.node)
      .map(f => ({
        findingId: f.findingId,
        ruleName: f.ruleName,
        analysisContext: f.analysisContext.analyzerName,
        suppressions: f.suppressions.map(s => s.suppressionType).join(","),
        scmLink: f.scmLink.href
      }));
  } else {
    console.error("Invalid response from API");
    return [];
  }
}

/**
 * Display the findings in a Google Sheet
 * @param {array} boostSecurityFindings - The findings to display
 */
function displayFindings(boostSecurityFindings) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Prepare sheet
  sheet.clear();
  sheet.setName(SHEET_NAME);
  sheet.appendRow(HEADERS);
  sheet.getRange(1,1,1,sheet.getMaxColumns()).setFontWeight("bold");
  sheet.setFrozenRows(1);

  // Add values
  let findingsArray = boostSecurityFindings.map(finding => [
    finding.findingId,
    finding.ruleName,
    finding.analysisContext,
    finding.suppressions,
    finding.scmLink
  ]);
  
    if (findingsArray.length > 0) {
    sheet.getRange(2, 1, findingsArray.length, HEADERS.length).setValues(findingsArray);
  } else {
    console.error("No findings to display");
  }
}

/**
 * Main function to get all findings
 */
function getAllFindings() {
  let graphqlQuery = prepareQuery();
  let response = fetchData(graphqlQuery);
  let findings = parseResponse(response);
  displayFindings(findings);
}
