Overview
Our API allows your application to connect to internal application functionality. Our current implementation involves features such as:

Creating and Updating Leads (including custom fields)
Integrating with the Automation Engine via lead field change events (this is automatic)
Creating, updating, and retrieving Campaigns, Accounts, and Opportunities
Feedback
We value the feedback of our clients. We want to provide a developer experience that allows seamless integrations, but we need your help! If you have any questions, comments, or ideas for our API, please contact support.

API Keys
In order to access the API, you must generate both an account ID and an API key. Our API currently does not support sessions, so these keys must be supplied during each request.

Click here to generate your API keys.

Request & Response Format
All requests are made using an HTTPs POST encoded in JSON. We use a standard very similar to JSON-RPC for request handling.

Requests must be made to the following URL:

https://api.sharpspring.com/pubapi/{api-version-here}

v1
https://api.sharpspring.com/pubapi/v1/
Time zone arguments passed to this endpoint will be handled based on the time zone setting selected in the Company Profile

v1.2
https://api.sharpspring.com/pubapi/v1.2/
Time zone arguments passed to this endpoint will be handled in UTC

Authentication parameters may be appended to the URL as query strings, for example:

accountID={account-id-here}&secretKey={secret-key-here}

Alternately, you may provide the accountID as an HTTP header called X-Account-Id, and you may provide your secretKey with an Authorization: bearer token.

If an accountID/secretKey is provided in the query string, it will take precendence over the headers.

Each request must contain the following three fields:

method - the name of the API method being called
params - a parameters hash to be passed to the method
id - a user-supplied requestID for correlating requests
Each API response contains the following three fields:

result - The return value of the method called. Usually a list of Objects and Object-level errors
error - An API-Level error returned by the API
id - A user-supplied request ID for correlating requests
The following is an example of using the Core::getLead function to retrieve a single lead by its ID

For more information about methods and parameters, please view the methods section of the API documentation.

For example code, please view the examples section of the API documentation.

--------------


Lead
The Lead table consists of prospects who are possibly interested in your product. As a lead progresses through your pipeline, their status changes from unqualified to qualified. A lead can be converted into a contact, opportunity, or account.

If you wish to update custom fields for a lead, specify the custom field's "systemName" as the key in your 'lead' object. In order to get a list of system names, first retrieve members of the Field table.

Name	Type	Length	Is Required
id	bigint	20	Optional
accountID	bigint	20	Optional
ownerID	bigint	20	Optional
campaignID	bigint	20	Optional
isQualified	tinyint	1	Optional
isContact	tinyint	1	Optional
isCustomer	tinyint	1	Optional
status	int	3	Optional
leadStatus	picklist (open, unqualified, qualified, contact, customer)		Optional
leadScore	smallint	6	Optional
leadScoreWeighted	smallint	6	Optional
persona	string	128	Optional
active	tinyint	1	Optional
firstName	varchar	50	Optional
lastName	varchar	50	Optional
emailAddress	varchar	150	Required
companyName	varchar	100	Optional
title	varchar	255	Optional
street	varchar	255	Optional
city	varchar	255	Optional
country	varchar	255	Optional
state	varchar	50	Optional
zipcode	varchar	50	Optional
website	varchar	255	Optional
phoneNumber	varchar	255	Optional
trackingID	varchar	255	Optional
officePhoneNumber	varchar	255	Optional
phoneNumberExtension	varchar	255	Optional
mobilePhoneNumber	varchar	255	Optional
faxNumber	varchar	255	Optional
description	text		Optional
industry	varchar	255	Optional
isUnsubscribed	tinyint	1	Optional
updateTimestamp	timestamp		Optional
createTimestamp	timestamp		Optional


-----


Custom fields:

appointment
 Text input • Lead Field • Editable in Contact Manager
 
brand_name
 Text input • Lead Field • Editable in Contact Manager
 
date_created
 Datetime • Lead Field • Editable in Contact Manager
 
leadsource
 Text input • Lead Field • Editable in Contact Manager
 
lead_status
 Text input • Lead Field • Editable in Contact Manager
 
location_name
 Text input • Lead Field • Editable in Contact Manager
 
 Visualizer Lead
 Picklist • Lead Field • Editable in Contact Manager