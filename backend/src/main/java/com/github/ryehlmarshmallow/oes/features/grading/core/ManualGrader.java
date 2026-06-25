package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.ManualRubric;
import org.jspecify.annotations.NonNull;

@GraderFor(
    allQuestionTypes = true,
    graderType = GraderType.MANUAL
)
public class ManualGrader extends TypedGrader<ManualRubric, QuestionResponseData> {

    public ManualGrader() {
        super(ManualRubric.class, QuestionResponseData.class);
    }

    @Override
    protected GradingResult doGrade(Question question, @NonNull ManualRubric rubric, @NonNull QuestionResponseData responseData) {
        return GradingResult.ungraded();
    }
}
