/*
* Get scan history from BoostSecurity
*
* IMPORTANT
* Assumes the Google Sheet it is sending information to is named "Scan Attestation", has 2 frozen rows at the top, and has a start date and and end date in cells B1 and D1 respectively as is shown in line 202
* See a sample at https://docs.google.com/spreadsheets/d/e/2PACX-1vT5obGg7P4ckbnfvgZ8n_Bn3gkBNfFRTgTvjfCKztB0s0oZYAkEtOWg_B3Z1e1eTOGmGDjn2T52ZEwo/pubhtml?gid=950015480&single=true
*/
function getScanHistory() {
  /*
  * Get date range
  */
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Scan Attestation");
  var startDate = Utilities.formatDate( sheet.getRange("B1").getValue(), "GMT", "yyyy-MM-dd" );
  var endDate   = Utilities.formatDate( sheet.getRange("D1").getValue(), "GMT", "yyyy-MM-dd" );

  /*
  * Prepar the query
  */
  let url = "https://api.boostsecurity.io/analysis-history/graphql";

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
  /*
  * Call the API
  */
  let params = {
    method: "POST",
    payload: graphql,
    headers: {
      "Content-Type": "application/json",
      Authorization: "ApiKey " + PropertiesService.getScriptProperties().getProperty("apiKey"),
    },
  };
  var responseText = UrlFetchApp.fetch(url, params).getContentText();

  /* 
  * get only the desired information
  */
  var arrayOfFindings = JSON.parse(responseText).data.analyses.edges.map(f => f.node);
  var arrayOfFindingsDetails = arrayOfFindings.map(f => Object.values({
    timestamp: Utilities.formatDate(new Date(f.timestamp), "GMT", "yyyy-MM-dd"),
    repository: (f.asset.scmProvider +"."+ f.asset.organizationName +"."+ f.asset.repositoryName),
    scanner: f.analyzer.analyzerName,
    status: f.status.statusName
  }));

  /*
  * Display the findings
  */
  displayFindingsInSpreadsheet(arrayOfFindingsDetails);
}




/*
* Display the findings from BoostSecurity
* @param {multi-dimensional array} rows of each finding's data
*/
function displayFindingsInSpreadsheet(boostSecurityFindings) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Scan Attestation");
  // prepare sheet
  /* No need to recreate the header each time
  sheet.setName("BoostSecurity Scan Attestation");
  sheet.appendRow(["Timestamp", "Repo", "Scanner", "Successful"]);
  sheet.setFrozenRows(2);
*/
  // clear current contents
  sheet.getRange(3,1,sheet.getMaxRows(),4).clear();

  // add values
  sheet.getRange(3, 1, boostSecurityFindings.length, 4).setValues( boostSecurityFindings );
}
