package com.github.ryehlmarshmallow.oes.features.grading.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.grading.core.Grader;
import com.github.ryehlmarshmallow.oes.features.grading.core.GradingRegistry;
import com.github.ryehlmarshmallow.oes.features.grading.core.GradingResult;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GradingService {

    private final GradingRegistry gradingRegistry;

    public GradingResult grade(Question question, QuestionResponseData responseData) {
        Grader grader = gradingRegistry.resolveGrader(question.getType(), question.getRubric().getGraderType());
        return grader.grade(question, responseData);
    }
}
