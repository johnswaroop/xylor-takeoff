# Workflow Service

This document outlines the complete user workflow and screen specifications for the takeoff application, covering authentication flows and role-based user journeys.

## Overview

The workflow service manages three primary user types:

- **General Users**: Authentication and onboarding
- **Business Development (BD)**: Lead management and client communication
- **Estimators**: Project estimation and analysis

---

## Authentication Workflow

### 1. Landing Page

- **Purpose**: Entry point for all users
- **Components**:
  - Hero section with value proposition
  - Login/Signup options
  - Role selection hints

### 2. Signup Flow [x]

- **Screen**: Registration form
- **Fields**:
  - Full name
  - Email address
  - Password (with strength validation)
  - Role selection (BD/Estimator)
  - Company name (optional)
- **Actions**:
  - Form validation
  - Email verification
  - Account creation
  - Automatic role assignment

### 3. Login Flow [x]

- **Screen**: Login form
- **Fields**:
  - Email
  - Password
- **Features**:
  - Remember me option
  - Forgot password link
  - Role-based redirection after login

---

## Business Development (BD) Workflow

### 1. BD Dashboard

- **Route**: `/bd/dashboard`
- **Purpose**: Central hub for lead management
- **Components**:
  - **Header**: Navigation, user profile, notifications
  - **Stats Panel**:
    - Active leads count
    - Conversion rate
    - Revenue pipeline
    - Monthly targets
  - **Recent Activity Feed**:
    - Latest lead interactions
    - Form submissions
    - Status updates
  - **Quick Actions**:
    - "New Lead" button (primary CTA)
    - "Import Leads" option
    - "View Reports" link
  - **Leads Overview Table**:
    - Lead name/company
    - Status badges
    - Last contact date
    - Assigned estimator
    - Quick action buttons

### 2. Create Lead Flow

- **Route**: `/bd/leads/create`
- **Purpose**: Add new lead to the system
- **Screen Structure**:
  - **Step 1 - Lead Information**:
    - Company/Customer name (required)
    - Contact person name
    - Email address (required)
    - Phone number
    - Address/Location
    - Project type dropdown
    - Initial notes/description
  - **Step 2 - Form Assignment**:
    - Form template selection
    - Template preview
    - Custom form builder option
  - **Step 3 - Review & Send**:
    - Lead summary review
    - Email template customization
    - Send options:
      - Save as draft
      - Save and send immediately
      - Schedule send

### 3. Lead Management Page

- **Route**: `/bd/leads/[leadId]`
- **Purpose**: Comprehensive lead interaction hub
- **Layout Sections**:
  - **Lead Header**:
    - Company name and contact info
    - Status indicator with change dropdown
    - Last activity timestamp
  - **Lead Details Panel**:
    - Contact information
    - Project details
    - Form responses
    - Edit button (opens modal)
  - **Activity Timeline**:
    - Email communications
    - Phone call logs
    - Status changes
    - Form submissions
    - Internal notes
  - **Action Panel**:
    - Send email button
    - Log call button
    - Add note button
    - View form response button
    - Assign estimator dropdown

### 4. Communication Tools

- **Email Interface**:
  - Template library
  - Custom email composer
  - Attachment support
  - Send tracking
- **Call Logging**:
  - Call duration
  - Call notes
  - Follow-up reminders
  - Outcome tracking

---

## Estimator Workflow

### 1. Estimation Dashboard

- **Route**: `/estimator/dashboard`
- **Purpose**: Overview of assigned projects and workload
- **Components**:
  - **Performance Metrics**:
    - Projects completed this month
    - Average completion time
    - Accuracy ratings
    - Pending assignments
  - **Assigned Projects Table**:
    - Project name/company
    - Priority level
    - Due date
    - Status (Not Started, In Progress, Review, Completed)
    - Progress indicator
    - Action buttons

### 2. Project Estimation Flow

- **Route**: `/estimator/projects/[projectId]`
- **Purpose**: Complete estimation workflow
- **Screen Sections**:
  - **Project Overview**:
    - Lead information
    - Project requirements
    - Submitted forms/documents
    - BD notes and context
  - **Estimation Tools**:
    - Image annotation interface
    - Measurement tools
    - Material calculators
    - Labor time estimators
  - **Progress Tracking**:
    - Estimation completion percentage
    - Time spent tracking
    - Save draft functionality
    - Status updates

### 3. Review & Submission

- **Components**:
  - Estimation summary
  - Cost breakdown
  - Timeline projections
  - Confidence level indicators
  - Internal notes for BD team
  - Final submission workflow

---

## Admin Workflow

### 1. Admin Dashboard

- **Route**: `/admin/dashboard`
- **Purpose**: System-wide management and oversight
- **Components**:
  - **System Overview**:
    - Total users count by role
    - Active sessions
    - System health metrics
    - Recent user activities
  - **Quick Stats Panel**:
    - BD users count
    - Estimator users count
    - Admin users count
    - Pending user approvals
  - **Recent Activities Feed**:
    - New user registrations
    - Role changes
    - System alerts
    - User deactivations
  - **Quick Actions**:
    - "Add New User" button
    - "User Management" link
    - "System Settings" link
    - "Reports" link

### 2. User Management

- **Route**: `/admin/users`
- **Purpose**: Comprehensive user administration
- **Screen Sections**:
  - **Users Table**:
    - User avatar and name
    - Email address
    - Role badge (BD/Estimator/Admin)
    - Status (Active/Inactive/Pending)
    - Last login date
    - Registration date
    - Action buttons (Edit, Deactivate, Delete)
  - **Filters & Search**:
    - Search by name/email
    - Filter by role
    - Filter by status
    - Sort options
  - **Bulk Actions**:
    - Select multiple users
    - Bulk role assignment
    - Bulk deactivation
    - Export user list

### 3. Add User Flow

- **Route**: `/admin/users/create`
- **Purpose**: Create new users with role assignment
- **Form Structure**:
  - **User Information**:
    - Full name (required)
    - Email address (required)
    - Role selection (required):
      - Business Development (BD)
      - Estimator
      - Admin
    - Phone number (optional)
    - Company/Department
  - **Account Settings**:
    - Password generation options:
      - Auto-generate secure password
      - Custom password input
    - Account status:
      - Active immediately
      - Require email verification
    - Permissions (role-based):
      - **BD Permissions**:
        - Manage leads
        - Send communications
        - Access reports
      - **Estimator Permissions**:
        - Access assigned projects
        - Use estimation tools
        - Submit estimates
      - **Admin Permissions**:
        - User management
        - System settings
        - Full access override
  - **Notification Settings**:
    - Send welcome email
    - Include login credentials
    - Setup instructions

### 4. Edit User Flow

- **Route**: `/admin/users/[userId]/edit`
- **Purpose**: Modify existing user details and permissions
- **Components**:
  - **User Profile Section**:
    - Edit personal information
    - Change email address (with verification)
    - Update contact details
  - **Role & Permissions Management**:
    - Change user role
    - Modify specific permissions
    - Access level adjustments
  - **Account Status**:
    - Activate/Deactivate account
    - Reset password
    - Force logout from all sessions
  - **Activity Log**:
    - Recent login history
    - Permission changes history
    - Account modifications log

### 5. Bulk User Import

- **Route**: `/admin/users/import`
- **Purpose**: Import multiple users via CSV/Excel
- **Features**:
  - **File Upload**:
    - CSV/Excel file support
    - Template download
    - File validation
  - **Mapping Interface**:
    - Column mapping to user fields
    - Required field validation
    - Preview imported data
  - **Import Options**:
    - Default role assignment
    - Password generation settings
    - Email notification preferences
  - **Results Summary**:
    - Successful imports count
    - Failed imports with reasons
    - Download error report

### 6. Role Management

- **Route**: `/admin/roles`
- **Purpose**: Manage role definitions and permissions
- **Components**:
  - **Role Overview**:
    - List of all roles
    - Users count per role
    - Permission summaries
  - **Permission Matrix**:
    - Feature/permission grid
    - Role-based access control
    - Custom permission creation
  - **Role Creation**:
    - Define new roles
    - Assign permissions
    - Set access levels

### 7. User Analytics

- **Route**: `/admin/analytics`
- **Purpose**: User behavior and system usage insights
- **Reports**:
  - **User Activity Reports**:
    - Login frequency
    - Feature usage statistics
    - Time spent by role
  - **Performance Metrics**:
    - BD conversion rates
    - Estimator productivity
    - System adoption rates
  - **Security Reports**:
    - Failed login attempts
    - Permission changes audit
    - Suspicious activity alerts

---

## Navigation & Common Components

### Global Navigation

- **BD Users**:
  - Dashboard
  - Leads (All, Active, Converted)
  - Forms & Templates
  - Reports & Analytics
  - Settings
- **Estimators**:
  - Dashboard
  - Assigned Projects
  - Completed Projects
  - Tools & Resources
  - Settings
- **Admins**:
  - Dashboard
  - User Management
  - Role Management
  - System Settings
  - Analytics & Reports
  - Audit Logs

### Status Management

- **Lead Statuses**:
  - New
  - Contacted
  - Form Sent
  - Form Completed
  - In Estimation
  - Quoted
  - Won
  - Lost
- **Estimation Statuses**:
  - Assigned
  - In Progress
  - Review Required
  - Completed
  - Approved
- **User Statuses**:
  - Active
  - Inactive
  - Pending Verification
  - Suspended

---
