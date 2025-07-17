# Product Outline: Lead Management & Estimation System

## Overview

A comprehensive lead management and estimation system that streamlines the process from initial lead creation to final estimate approval, featuring integrated communication tools and AI-powered insights.

## Workflow Process

### 1. Lead Creation & Assignment

- **Business Development (BD)** creates a lead with detailed information
- BD assigns an **Estimator** to the lead
- Lead enters initial status: _Add Lead_

### 2. Qualifier Collection

- BD creates qualification form from templates
- Form sent to client via built-in **Email Service**
- Status: _Send Qualifiers_

#### Qualification Requirements:

1. **Basic client details**
2. **Project funding status** (secured/pending)
3. **Council license approval** status
4. **Plan PDF availability**

### 3. Client Response & Review

- Client completes qualification form
- Status: _Awaiting Qualifier Response_ → _Response Received_
- BD reviews client responses
- Status: _Review Qualifier Response_

#### BD Options:

- **Accept**: Proceed to estimation
- **Reject**: Request additional details via **Email Service** or **Calling Service**
- **Approved**: Send for estimates (Status: _Sent for Estimates_)

### 4. Estimation Process

- Estimator performs cost estimation using **Estimation Service**
- Status: _Estimation in Progress_
- Completed estimates returned to BD
- Status: _Estimates Ready_

#### BD Estimate Review:

- **Accept**: Proceed to client sharing
- **Reject**: Return to estimator (Status: _Estimation in Progress_)

### 5. Client Estimate Review

- BD shares estimate with client via **Email Service**
- Status: _Shared with Client_
- Client receives estimate link with action options:
  - **Accept Estimate**
  - **Reject Estimate** (with reason)
- Final Status: _Estimate Approved_ or _Estimate Rejected_

### 6. Completion

- Process concludes with status: _Completed_

## User Roles & Responsibilities

### Business Development (BD)

- Lead creation and management
- Client communication
- Qualifier review and approval
- Estimate approval and sharing
- Process oversight

### Estimator

- Cost estimation and analysis
- Technical review of project requirements
- Estimate preparation and refinement

### Client

- Qualification form completion
- Estimate review and decision
- Communication with BD team

### Admin

- System oversight
- Access to all lead data
- Team coordination

## Core Features & Services

### 1. Workflow Manager

- **Authentication system**
- **Role-based access control**
- **Centralized dashboard**
- Status tracking and management

### 2. Email Service

- **Outbound communications** to clients
- **Inbound response handling**
- Template management
- Communication history tracking

### 3. Calling Service

- **Client communication capabilities**
- **Call transcript recording**
- Integration with lead management

### 4. Estimation Service

- **Cost calculation tools**
- **Project analysis capabilities**
- **Estimate generation and formatting**

### 5. Unified AI Chat Service

- **Context-aware responses** based on consolidated lead data
- **Source citation** for accuracy
- **Question answering** for BD/Admin queries

### 6. Internal Chat Service

- **Team communication**
- **Group chat functionality**
- **Multi-role collaboration** (BD, Admin, Estimator)

## Unified Communication & Intelligence Dashboard

### Consolidated Lead Data Display

- **Lead details** and current status
- **Estimation information** and history
- **Email communications** (sent/received)
- **Call logs** and transcripts
- **Process timeline** and status updates

### Intelligence Features

- **AI-powered insights** from lead data
- **Contextual question answering**
- **Source attribution** for data accuracy
- **Trend analysis** and reporting

## Technical Architecture

### Major Application Components

1. **Workflow Manager** (Auth, Role access, Dashboard)
2. **Email Service** (send/receive emails to clients)
3. **Calling Service** (client communication)
4. **Estimator Service** (cost calculation and analysis)
5. **Unified AI Chat Service** (intelligent assistance)
6. **Internal Chat Service** (team collaboration)

### Data Management

- Centralized lead repository
- Communication history storage
- Estimate and document management
- User activity tracking
- Integration between all services

## Status Flow Summary

### Status Chronology

**Phase 1: Lead Initiation**

1. **Add Lead** - BD creates new lead with initial details
2. **Attach Qualifiers** - BD prepares qualification requirements

**Phase 2: Client Qualification** 3. **SEND QUALIFIERS** - Qualification form sent to client via email 4. **Awaiting Qualifier Response** - System waiting for client input 5. **Response Received** - Client has submitted qualification form

**Phase 3: Qualification Review** 6. **Review Qualifier Response** - BD evaluates client responses

- _Branch A_: Approved → Continue to Phase 4
- _Branch B_: Additional info needed → Return to step 3
- _Branch C_: Rejected → End process

**Phase 4: Estimation Process** 7. **Sent for Estimates** - Qualified lead forwarded to estimator 8. **Estimation in Progress** - Estimator performing cost analysis 9. **Estimates Ready** - Estimation completed, awaiting BD review

- _Branch A_: BD Approved → Continue to Phase 5
- _Branch B_: BD Rejected → Return to step 8

**Phase 5: Client Estimate Review** 10. **Shared with Client** - Estimate sent to client for decision 11. **Awaiting Estimate Decision** - Client reviewing estimate

**Phase 6: Final Decision** 12. **Estimate Approved** - Client accepts estimate
OR
**Estimate Rejected** - Client declines estimate (with reason) 13. **Completed** - Process concluded

### Visual Flow Diagram

```
Add Lead → Attach Qualifiers → SEND QUALIFIERS → Awaiting Qualifier Response →
Response Received → Review Qualifier Response → Sent for Estimates →
Estimation in Progress → Estimates Ready → Shared with Client →
Awaiting Estimate Decision → Estimate Approved/Rejected → Completed
```

### Status Loops & Branches

- **Qualification Loop**: Steps 3-6 can repeat if additional information is needed
- **Estimation Loop**: Steps 8-9 can repeat if BD rejects initial estimate
- **Decision Points**:
  - Step 6: BD can approve, request more info, or reject
  - Step 9: BD can approve or reject estimate
  - Step 12: Client can approve or reject final estimate
