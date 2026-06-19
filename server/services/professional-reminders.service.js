import logger from "../utils/logger.js";
import NotificationService from "../utils/notification.service.js";

/**
 * ProfessionalReminderService
 * Placeholder service for sending reminders to customers about their upcoming practice sessions.
 * This can be run on a cron schedule (e.g. node-cron) or by a background worker.
 */
class ProfessionalReminderService {
  /**
   * Scan for tasks that are upcoming and haven't had reminders sent.
   */
  static async sendUpcomingReminders() {
    try {
      logger.info("Starting professional reminder job...");
      // Logic would be:
      // 1. Find all ProfessionalTask where `date` + `startTime` is within `reminderMinutes` from now.
      // 2. AND reminderSent is false (you would add a `reminderSent` boolean flag to the model).
      // 3. For each task, check if task.customer has email or phone.
      // 4. Send email/WhatsApp.
      // 5. Mark task as reminder sent.

      logger.info("Finished professional reminder job.");
    } catch (error) {
      logger.error("Error sending professional reminders:", error);
    }
  }

  static async sendEmailReminder(customer, task) {
    if (!customer.email) return;
    logger.info(
      `Sending email reminder to ${customer.email} for task: ${task.title}`
    );
    // Integrations with Resend/SendGrid/Nodemailer goes here
  }

  static async sendWhatsAppReminder(customer, task) {
    if (!customer.phone) return;
    logger.info(
      `Sending WhatsApp reminder to ${customer.phone} for task: ${task.title}`
    );
    NotificationService.sendWhatsApp({
      phone: customer.phone,
      message: `Reminder: ${task.title}`,
      templateName:
        process.env.MSG91_WHATSAPP_REMINDER_TEMPLATE || "general_messages",
      params: {
        customer_name: customer.name || "Player",
        update_line_1: `This is a reminder for your upcoming session: ${task.title}.`,
        update_line_2: `Date: ${task.date} | Time: ${task.startTime}`,
        update_line_3: `Please be on time.`,
        status_text: "Reminder",
        footer_note: "See you there!",
      },
    });
  }
}

export default ProfessionalReminderService;
