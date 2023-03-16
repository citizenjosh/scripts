/*
* Get finding details from BoostSecurity
* via GraphQL API and
* put them in a Google Sheet
*
* NOTE: to change the quantity of results, manually change the values in "variables" on #155
*/
function getAllFindings() {
  /*
  * Prepar the query
  */
  let url = "https://api.boostsecurity.io/findings-view/graphql";
  let graphql = JSON.stringify({

    /* Findings Details */
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
      totalCount
      edges {
        node {
          timestamp
          findingId
          ruleDescription
          ruleName
          originalRuleId
          uri
          isViolation
          severity
          confidence
          docRef
          categories {
             name
             prettyName
             ref
          }
          description
          analysisContext {
            analyzerName
            organizationName
            projectName
            commitId
            scmProvider
            baseUrl
          }
          prettyRuleName
          prettyDescription
          scmLink {
            text
            href
          }
          meta {
            name
            value
          }
          findingContextId
          suppressions {
            suppressionTagId
            suppressionType
            justification
            mutable
          }
          vulnerabilityIdentifiers { value }
          details {
            __typename
            ... on SastDetails {
                fileLocation {
                  uri
                  scmVersioned
                  startLineNumber
                  startColumnNumber
                  endLineNumber
                  endColumnNumber
                }
            }
            ... on ScaDetails {
                package {
                  name
                  ecosystem
                }
                requirement
                manifestFileLocation {
                  uri
                  scmVersioned
                  startLineNumber
                  startColumnNumber
                  endLineNumber
                  endColumnNumber
                }
                impactedVersions
                cvssScore
                advisoryLink
                cve
            }
            ... on CicdDetails {
                repositoryName
            }
            ... on ContainerScanningDetails {
                vulnerabilityId
                imageName
                imageVersion
                tags
                layerId
                requirement
                impactedVersions
                cvssScore
                advisoryLink
                package {
                    name
                    ecosystem
                }
            }
          }
        }
        cursor
      }
      filters {
        ruleName { value count displayValue }
        viewerAssetId { value count displayValue }
        suppressionTag { value count }
        isViolation { value count }
        processingStatus { value count }
        scannerId { value count displayValue }
        securityCategories { value count }
        severities { value count }
        confidences { value count }
        vulnerabilityIdentifiers { value count }
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
      "first": 5,
      "page": 2
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
  var arrayOfFindings = JSON.parse(responseText).data.findings.edges.map(f => f.node);
  var arrayOfFindingsDetails = arrayOfFindings.map(f => Object.values({
    findingId: f.findingId,
    ruleName: f.ruleName,
    analysisContext: f.analysisContext.analyzerName,
    suppressions: f.suppressions.join(","),
    scmLink: f.scmLink.href
  }));

  /*
  * Display the findings
  */
  displayFindingsInSpreadsheet(arrayOfFindingsDetails);
}




/*
* Display the findings from BoostSecurity
* @param {multi-dimensional array} rows of each finding's demographical data
*/
function displayFindingsInSpreadsheet(boostSecurityFindings) {

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // prepare sheet
  sheet.clear();
  sheet.setName("BoostSecurity Finding Details");
  sheet.appendRow(["Finding ID", "Rule Name", "Scanner", "Suppression(s)", "URL"]);
  sheet.getRange(1,1,1,sheet.getMaxColumns()).setFontWeight("bold");
  sheet.setFrozenRows(1);

  // add values
  sheet.getRange(2, 1, boostSecurityFindings.length, 5).setValues(boostSecurityFindings);
}
