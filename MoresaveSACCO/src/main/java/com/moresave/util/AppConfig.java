package com.moresave.util;

import java.io.*;
import java.util.Properties;

/**
 * Persistent app configuration stored in user home directory.
 * Settings are saved to: ~/moresave_sacco_config.properties
 * Admin configures email/SMS credentials from the Settings screen inside the app.
 */
public class AppConfig {

    private static final String CONFIG_FILE =
        System.getProperty("user.home") + File.separator + "moresave_sacco_config.properties";

    private static Properties props = null;

    private static Properties load() {
        if (props != null) return props;
        props = new Properties();
        // Defaults
        props.setProperty("email.enabled",   "false");
        props.setProperty("email.host",      "smtp.gmail.com");
        props.setProperty("email.port",      "587");
        props.setProperty("email.address",   "");
        props.setProperty("email.password",  "");
        props.setProperty("sms.enabled",     "false");
        props.setProperty("sms.username",    "sandbox");
        props.setProperty("sms.apikey",      "");
        props.setProperty("sms.senderid",    "MORESAVE");
        props.setProperty("mobilemoney.enabled", "false");
        props.setProperty("mobilemoney.apikey",  "");
        props.setProperty("mobilemoney.username","");

        File f = new File(CONFIG_FILE);
        if (f.exists()) {
            try (FileInputStream fis = new FileInputStream(f)) {
                props.load(fis);
            } catch (IOException e) {
                System.out.println("Config load error: " + e.getMessage());
            }
        }
        return props;
    }

    public static String get(String key) {
        return load().getProperty(key, "");
    }

    public static boolean getBool(String key) {
        return "true".equalsIgnoreCase(get(key));
    }

    public static void set(String key, String value) {
        load().setProperty(key, value);
    }

    public static boolean save() {
        try (FileOutputStream fos = new FileOutputStream(CONFIG_FILE)) {
            load().store(fos, "Moresave SACCO Configuration");
            return true;
        } catch (IOException e) {
            System.out.println("Config save error: " + e.getMessage());
            return false;
        }
    }

    public static void reload() {
        props = null;
        load();
    }
}
