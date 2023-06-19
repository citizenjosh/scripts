/*
* Create a scan attestation report from BoostSecurity
*
* IMPORTANT
* Assumes the Google Sheet it is sending information to is named "Scan Attestation", has 2 frozen rows at the top, and has a start date and and end date in cells B1 and D1 respectively as is shown in line 202
* See a sample at https://docs.google.com/spreadsheets/d/e/2PACX-1vT5obGg7P4ckbnfvgZ8n_Bn3gkBNfFRTgTvjfCKztB0s0oZYAkEtOWg_B3Z1e1eTOGmGDjn2T52ZEwo/pubhtml?gid=950015480&single=true
*/

// Constants
const SHEET_NAME = "Scan Attestation";
const API_URL = "https://api.boostsecurity.io/analysis-history/graphql";
const API_KEY = PropertiesService.getScriptProperties().getProperty("apiKey");
const DATE_FORMAT = "yyyy-MM-dd";
const AUTHORIZATION_HEADER = "ApiKey " + API_KEY;
const COLUMNS = ["Timestamp", "Repo", "Scanner", "Successful"];

/**
 * Get scan history from BoostSecurity
 */
function getScanHistory() {
  // Get date range
  const {startDate, endDate} = getDateRange();

  // Call the API
  const arrayOfFindingsDetails = callBoostSecurityAPI(startDate, endDate);

  // Display the findings
  displayFindingsInSpreadsheet(arrayOfFindingsDetails);
}

/**
 * Retrieves the start and end date from the Google Sheet
 * @returns {Object} An object containing the start and end dates
 */
function getDateRange() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const startDate = Utilities.formatDate(sheet.getRange("B1").getValue(), "GMT", DATE_FORMAT);
  const endDate = Utilities.formatDate(sheet.getRange("D1").getValue(), "GMT", DATE_FORMAT);

  return {startDate, endDate};
}

/**
 * Makes a call to the BoostSecurity API and retrieves the scan findings
 * @param {Date} startDate - The start date for the data retrieval
 * @param {Date} endDate - The end date for the data retrieval
 * @returns {Array} An array of scan findings
 */
function callBoostSecurityAPI(startDate, endDate) {
  // Prepare the query
  let graphql = JSON.stringify({

    /* Findings Details */
    query: `query (
  $first: Int,
  $after: String,
  $last: Int,
  $page: Int,
  $before: String,
  $assets: [String!]
  $assetTypes: [AssetTypeNameSchema!]
  $analyzers: [String!]
  $statuses: [StatusNameSchema!]
  $assetIds: [String!]
  $orderBy: [AnalysesOrder!]
  $fromDate: Date
  $toDate: Date
) { 
  analyses(
    first: $first
    after: $after
    last: $last
    before: $before
    page: $page
    filters: {
      assets: $assets
      assetTypes:$assetTypes
      analyzers:$analyzers
      statuses:$statuses
      assetIds:$assetIds
    }
    orderBy: $orderBy
    fromDate: $fromDate
    toDate: $toDate
  ) {
    filters {
      assets {
        value
        display
        count
      }
      assetTypes {
        count
        value
      }
      analyzers {
        count
        displayValue
        value
      }
      statuses {
        count
        value
      }
    }
    totalCount
    edges {
      node {
        analysisId
        accountId
        timestamp
        durationSeconds
        findingCount
        violationCount
        analyzerType
        analyzer {
          analyzerName
        }
        asset {
          __typename
          ... on ScmOrganization {
            assetType
            scmProvider
            baseUrl
            organizationName
          }
          ... on ScmRepository {
            assetType
            scmProvider
            baseUrl
            organizationName
            repositoryName
          }
          ... on ScmRepositoryCode {
            assetType
            scmProvider
            baseUrl
            organizationName
            repositoryName
            branchName
            commitId
            label
          }
          ... on ScmRepositoryCodeChange {
            assetType
            scmProvider
            baseUrl
            organizationName
            repositoryName
            branchName
            commitId
            pullRequestId
            label
          }
        }
        status {
          ...on Success {
            statusName
          }
          ...on Error {
            messages
            statusName
          }
          ...on Timeout {
            timeoutSeconds
            statusName
          }
          ...on BrokenInstallation {
            message
            statusName
          } 
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}`,
    /*
    * Filter results
    */
    variables: {
      "fromDate": startDate,
      "toDate": endDate
    },
  });

  let params = {
    method: "POST",
    payload: graphql,
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTHORIZATION_HEADER,
    },
  };

  // Error handling for API call
  try {
    var responseText = UrlFetchApp.fetch(API_URL, params).getContentText();
  } catch (error) {
    console.error("Error fetching data from BoostSecurity API: ", error);
    return [];
  }

  // Process the response
  var arrayOfFindings = JSON.parse(responseText).data.analyses.edges.map(f => f.node);
  return arrayOfFindings.map(f => Object.values({
    timestamp: Utilities.formatDate(new Date(f.timestamp), "GMT", DATE_FORMAT),
    repository: (f.asset.scmProvider +"."+ f.asset.organizationName +"."+ f.asset.repositoryName),
    scanner: f.analyzer.analyzerName,
    status: f.status.statusName
  }));
}

/**
 * Displays the scan findings in the Google Sheet
 * @param {Array} boostSecurityFindings - An array of findings from the BoostSecurity API
 * @returns {void}
 */
function displayFindingsInSpreadsheet(boostSecurityFindings) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  // Clear current contents
  sheet.getRange(3, 1, sheet.getMaxRows(), COLUMNS.length).clear();

  // Add values
  sheet.getRange(3, 1, boostSecurityFindings.length, COLUMNS.length).setValues(boostSecurityFindings);
}


