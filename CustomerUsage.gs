/**
 * Get high-level account information
 * 
 * IMPORTANT
 * Assumes the Google Sheet it is sending information to is named "Usage History"
 */


/**
 * Makes a POST request to a GraphQL API endpoint.
 *
 * @param {string} url - The URL of the API endpoint.
 * @param {string} query - The GraphQL query.
 * @param {Object} variables - The variables for the GraphQL query.
 * @returns {Object} The parsed JSON response.
 */
function callApi(url, query, variables) {
  let graphql = JSON.stringify({
    query: query,
    variables: variables,
  });

  let params = {
    method: "POST",
    payload: graphql,
    headers: {
      "Content-Type": "application/json",
      Authorization: "ApiKey " + PropertiesService.getScriptProperties().getProperty("apiKey"),
    },
  };

  var responseText = UrlFetchApp.fetch(url, params).getContentText();
  return JSON.parse(responseText);
}

/**
 * Makes a request to the 'findings-view' API endpoint.
 *
 * @param {string} query - The GraphQL query.
 * @param {Object} variables - The variables for the GraphQL query.
 * @returns {Object} The filters data from the response.
 */
function getFindingsData(query, variables) {
  const url = 'https://api.boostsecurity.io/findings-view/graphql';
  let response = callApi(url, query, variables);

  return response.data.findings.filters;
}

/**
 * Fetches organization data from the API.
 *
 * @returns {Array} An array of organization data.
 */
function getOrganizationData() {
  const url = 'https://api.boostsecurity.io/ci-provisioning/graphql';
  const query = `query ($search: String) {
    organizations(search: $search) {
      edges {
        node {
          repositories {
            totalCount
            needAttentionCount
          }
        }
      }
    }
  }`;

  let response = callApi(url, query, { "search": "" });
  let arrayOfOrganizations = response.data.organizations.edges.map(f => f.node);

  return arrayOfOrganizations.map(org => ({
    totalCount: org.repositories.totalCount,
    needAttentionCount: org.repositories.needAttentionCount,
  }));
}

/**
 * Fetches finding data from the API.
 *
 * @returns {Object} An object containing findingsCount and violationsCount.
 */
function getFindingData() {
  const query = `query (
    $filters: FindingsFiltersSchema,
    $first: Int,
  ) {
    findings(
        filters: $filters,
        first: $first,
    ) {
      filters {
        isViolation { value count }
      }
    }
  }`;

  let filtersData = getFindingsData(query, {
    "filters": {
      "confidences": ["HIGH"],
      "severities": ["CRITICAL"]
    },
    "first": 10
  });

  let isViolationData = filtersData.isViolation;
  let findingsCount = isViolationData.filter(f => !f.value).map(f => f.count)[0];
  let violationsCount = isViolationData.filter(f => f.value).map(f => f.count)[0];

  return { findingsCount, violationsCount };
}

/**
 * Fetches rule group data from the API.
 *
 * @returns {number} The rule group count.
 */
function getRuleGroupData() {
  const query = `query (
      $filters: FindingsFiltersSchema,
      $first: Int,
    ) {
      findings(
          filters: $filters,
          first: $first,
      ) {
        filters {
          ruleGroup { value }
        }
      }
    }`;

  let filtersData = getFindingsData(query, {
    "filters": {
      "confidences": ["HIGH"],
      "severities": ["CRITICAL"]
    },
    "first": 10
  });

  let ruleGroupCount = filtersData.ruleGroup.length;

  return ruleGroupCount;
}

/**
 * Fetches data from various API endpoints and updates the 'Usage History' sheet.
 *
 * @param {string} companyName - The name of the company.
 */
function updateCustomerUsageRegister(companyName) {
  let orgData = getOrganizationData();
  let findingData = getFindingData();
  let ruleGroupCount = getRuleGroupData();

  let totalOrgCount = orgData.length;
  let totalCountSum = '=SUM(' + orgData.map(d => d.totalCount).join(",") + ')';
  let needAttentionCountSum = '=SUM(' + orgData.map(d => d.needAttentionCount).join(",") + ')';

  let row = [
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    companyName,
    totalOrgCount,
    totalCountSum,
    needAttentionCountSum,
    ruleGroupCount,
    findingData.findingsCount,
    findingData.violationsCount
  ];

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usage History");
  sheet.appendRow(row);
}
