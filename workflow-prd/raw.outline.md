# Outline of the product

Add Lead → Attach Qualifiers → SEND QUALIFIERS → Awaiting Qualifier Response → Review Qualifier Response → Send for Estimates → Prepare Estimates → Estimates Ready, Share with Client → Awaiting Estimate Decision → Estimate Rejected / Estimate Approved → End

the BD can create a lead and add details about the lead (Add Lead)
BD assignes an **Estimator** to the lead
then he creates a form from the templates and sends it to the client using inbuilt **email service** (SEND QUALIFIERS)
the form contains details about (status) -
**1. Basic details about client**
**2. Is project funding secured**
**3. Is council license approved**
**4. Is plan PDF available** (Awaiting Qualifier Response)

-the client responds to the form with the required details (stat) (Response Received)

- BD Reviews the Response (Review Qualifier Response)
- BD can Reject or ask more details on email using **email service** or make a call useing **calling service**
- BD accepts and Sends the details for estimating cost (Sent for Estimates)

- the Estimator performs estimation using the **Estimation Service** (Estimation in progress)
- after completeing the estimation the data is sent back to the BD (Estimates Ready)
- The BD can Accept the estimate or send it back by setting status as (Estimation in progress)
- the BD after accepting the Estimate sends it to the client using **email service** status is (Shared with Client)
- the user receives the estimate link with an action to Accept or Reject the estimate and can add reason aswell for the same (Estimate Rejected / Estimate Approved)
- last stage is status (Completed)

# Unified Communication and Inteligence dashboard

all the data abou the lead including

# Consolidated Lead data

- Lead details
- current status
- Estimation
- emails sent and received
- Calls and call Transcripts

are available on a single dashboard

an **AI chat service** can answer questions by the BD/Admin based on the context provided in the form of **\*Consolidated Lead data**
it should be able to cite its sources for accurate answers

# internal chat for communicating with the team option matter most

BD , Admin , and Estimator can talk on a group chat here

# Major Parts of the application

- _Workflow Manager (Auth, Role access, Dashboard)_
- _Email service (send emails, receive emails) to the clients_
- _Calling Service (to communicate with the client)_
- _Estimator Service_
- _Unified AI chat Service_
- _Internal Chat Service_
