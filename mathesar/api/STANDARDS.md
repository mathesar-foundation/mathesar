# API Standards

Mathesar's REST API should be clean, consistent, and generally provide a good developer experience. Although our API supports the Mathesar frontend, it should be treated as its own product and built to support a variety of clients.

All API endpoints should follow the standards below to ensure consistency.

## Standards

Please note that we are assuming that all endpoints are RESTful and will involve CRUD (create, read, update, or delete) on a resource. This is a deliberate choice so that we try to fit operations into the a RESTful model.

We do want to keep our APIs sensible, so pragmatically, we may eventually need to implement non-CRUD APIs for some things. We will create standards for those when we encounter them.

### Versioning
- All API endpoints should include a version number at the base of the URL (e.g. `/api/v0/tables/`).
- Versions should be integers, not decimal numbers, prefixed with ‘v’.
    - `v0` endpoints are unstable and can change without warning.
    - `v1` endpoints (and onwards) are considered stable. 
- Stable versions should follow these rules:
    - Existing fields/parameters/values should not be removed.
    - New fields/parameters can be added, as long as they do not modify the behavior of existing fields/parameters/values.

### URLs
- A URL identifies a resource.
- URLs should include nouns, not verbs.
- Use plural nouns only for consistency (no singular nouns).
- You shouldn’t need to go deeper than resource/identifier/resource.
- URL v. header:
    - If it changes the logic you write to handle the response, put it in the URL.
    - If it doesn’t change the logic for each response, like OAuth info, put it in the header.
- Specify optional fields in a comma separated list.
- URLs should not include anything other than resource names and IDs.
    - Filters should be in GET query parameters.
    - HTTP verbs should be used for different types of operations

### HTTP Verbs
Use HTTP verbs (GET, POST, PATCH, PUT, DELETE) to operate on the collections and elements.

| **Verb** | **URL Pattern**         | **Action**                                                         | **Return Status Code** | **Response Data**            |
|----------|-------------------------|--------------------------------------------------------------------|------------------------|------------------------------|
| GET      | /api/v1/resources/      | List all resources                                                 | 200                    | List of resources + metadata |
| GET      | /api/v1/resources/{id}/ | Retrieve single resource with matching ID                          | 200                    | Single resource              |
| POST     | /api/v1/resources/      | Create a new resource with data in request body                    | 201                    | Single resource              |
| PUT      | /api/v1/resources/{id}/ | Replace entire resource with matching ID with data in request body | 200                    | Single resource              |
| PATCH    | /api/v1/resources/{id}/ | Update resource with matching ID with data in request body         | 200                    | Single resource              |
| DELETE   | /api/v1/resources/{id}/ | Delete resource with matching ID                                   | 204                    | *No data*                    |

### Responses

- The portion of the API response describing to a given resource should always contain the same set of keys.
- Keys should not contain values, they should always be a string description of the value.

### Errors
- The response status code should be 4xx when the error is handled, with 400 being the default.
- The response body should always be JSON.
- The error message should be formatted in one or more sentences, ending with a period and having no trailing spaces.
- Errors should have a Mathesar-specific integer error code to identify the error.
- We should strive to make each error message unique to its situation.
- Untrusted user input _is_ allowed inside error messages. Care should be taken to appropriately escape error messages when printing them in various contexts, as all error messages should be presumed to contain potentially malicious content.
- API error messages should be written primarily for an audience of Mathesar developers. The front end will typically print user-targeted error messages first, followed by the API error message if appropriate.
- Error representations should have the following keys:
    - `message`: The error message, in English.
    - `code`: A Mathesar-specific integer error code. We will create a separate spec for a list of error codes and what they mean. This page will be updated to link to it when ready.
    - `field`: The request field that the error is related to. This should be identical to a field name in the originating request. It can be `null`
    - `details`: Any additional details. This is a JSON object with arbitrary keys with details specific to a given error. It can be an empty object if there are no relevant details.
    - For example:
        ```json
        {
          "message": "This is an error message.",
          "code": "2045",
          "field": "name",
          "details": { "failed_ids": [1, 2, 3, 4] }
        }
        ```
- To keep responses consistent and easy to parse, API responses should always return a list of errors (a JSON array of objects following the above format), even if there's only a single error.
    - There are some instances where the API will return multiple errors. For example, the API may receive a `PATCH` request where several fields have invalid input, it will then return a list of errors with each field-specific error specified.
  
### Pagination
- We use limit/offset style pagination for all API endpoints.
- All list APIs should include pagination information for consistency, even if there is only one page of results.

## Resources
- Related discussions:
    - ["Define common error structure" on GitHub](https://github.com/centerofci/mathesar/issues/560)
- Many of these standards were borrowed from the [White House Web API Standards](https://github.com/WhiteHouse/api-standards).