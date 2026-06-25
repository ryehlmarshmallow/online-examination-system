package com.github.ryehlmarshmallow.oes.features.identity.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendVerificationCodeEmail(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Verify your account");
        message.setText(
            "Use this 6-digit code to verify your account: " + code + "\n\n" +
                "This code expires in 24 hours."
        );
        mailSender.send(message);
    }
}
