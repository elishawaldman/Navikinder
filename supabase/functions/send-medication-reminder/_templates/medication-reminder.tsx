import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface MedicationReminderEmailProps {
  child_name: string
  medication_name: string
  dose_amount: number
  dose_unit: string
  due_datetime: string
  dose_instance_id: string
  parent_name?: string
  parent_timezone?: string
  app_domain?: string
}

export const MedicationReminderEmail = ({
  child_name,
  medication_name,
  dose_amount,
  dose_unit,
  due_datetime,
  dose_instance_id,
  parent_name,
  parent_timezone = 'UTC',
  app_domain = 'navikinder.com',
}: MedicationReminderEmailProps) => {
  // Format the due time with user's timezone
  const dueTime = new Date(due_datetime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: parent_timezone,
  })
  
  const dueDate = new Date(due_datetime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: parent_timezone,
  })

  return (
    <Html>
      <Head />
      <Preview>
        {child_name}'s medication reminder: {medication_name} is due at {dueTime}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>💊 Medication Reminder</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={greeting}>
              {parent_name ? `Hi ${parent_name},` : 'Hi,'}
            </Text>
            
            <Text style={reminderText}>
              This is a friendly reminder that <strong>{child_name}</strong> has a medication due in 15 minutes.
            </Text>
            
            <Section style={medicationCard}>
              <Text style={medicationHeader}>Medication Details</Text>
              <Hr style={divider} />
              
              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Child:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{child_name}</Text>
                </Column>
              </Row>
              
              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Medication:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{medication_name}</Text>
                </Column>
              </Row>
              
              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Dose:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{dose_amount} {dose_unit}</Text>
                </Column>
              </Row>
              
              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Due Time:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={valueBold}>{dueTime}</Text>
                </Column>
              </Row>
              
              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Date:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{dueDate}</Text>
                </Column>
              </Row>
            </Section>
            
            <Section style={ctaSection}>
              <Link
                href={`https://${app_domain}/overview?reminder=${dose_instance_id}`}
                style={button}
              >
                Record This Medication
              </Link>
            </Section>
            
            <Text style={footerText}>
              Remember to log the dose once administered to keep your records accurate.
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerSmall}>
              You're receiving this because you have medication reminders enabled.
              <br />
              Pediatric Medication Tracker - Keeping families organized and safe.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default MedicationReminderEmail

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
}

const header = {
  textAlign: 'center' as const,
  padding: '0 20px',
}

const h1 = {
  color: '#1e40af',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
  textAlign: 'center' as const,
}

const content = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '32px',
  margin: '0 20px',
}

const greeting = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const reminderText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
}

const medicationCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  padding: '20px',
  margin: '0 0 24px',
}

const medicationHeader = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '0 0 16px',
}

const labelColumn = {
  width: '35%',
  paddingRight: '8px',
  verticalAlign: 'top' as const,
}

const valueColumn = {
  width: '65%',
  verticalAlign: 'top' as const,
}

const label = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 8px',
}

const value = {
  color: '#374151',
  fontSize: '14px',
  margin: '0 0 8px',
}

const valueBold = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0',
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
}

const footer = {
  borderTop: '1px solid #e5e7eb',
  marginTop: '24px',
  paddingTop: '16px',
}

const footerSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
  textAlign: 'center' as const,
}