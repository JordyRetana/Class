const { runJavaScriptCode } = require("./javascriptRunner");

function normalizeCode(code) {
  return String(code || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}();,:])\s*/g, "$1")
    .trim()
    .toLowerCase();
}

function normalizeOutput(output) {
  return Array.isArray(output) ? output.map((line) => String(line).trim()) : [];
}

async function evaluateSimple({ exercise, studentCode }) {
  if (exercise.evaluationType === "same_code") {
    return evaluateSameCode({
      referenceCode: exercise.referenceCode,
      studentCode
    });
  }

  if (exercise.evaluationType === "contains_keywords") {
    return evaluateContainsKeywords({
      keywords: exercise.keywords,
      studentCode
    });
  }

  if (exercise.evaluationType === "same_output") {
    if (exercise.language !== "javascript") {
      return {
        ok: true,
        score: 0,
        passed: false,
        evaluationType: "same_output",
        message: "La evaluacion por resultado solo esta disponible para JavaScript en este MVP.",
        details: {}
      };
    }

    return evaluateSameOutput({
      referenceCode: exercise.referenceCode,
      studentCode
    });
  }

  return {
    ok: false,
    score: 0,
    passed: false,
    message: "Tipo de evaluacion no valido.",
    details: {}
  };
}

function evaluateSameCode({ referenceCode, studentCode }) {
  const expected = normalizeCode(referenceCode);
  const received = normalizeCode(studentCode);
  const passed = expected === received;

  return {
    ok: true,
    score: passed ? 100 : 0,
    passed,
    evaluationType: "same_code",
    message: passed
      ? "Correcto. El codigo coincide con la solucion esperada."
      : "El codigo aun no coincide con la solucion esperada. Revise estructura, etiquetas, nombres o instrucciones solicitadas.",
    details: {
      expectedPreview: referenceCode,
      receivedPreview: studentCode
    }
  };
}

function evaluateContainsKeywords({ keywords, studentCode }) {
  const normalizedStudent = normalizeCode(studentCode);
  const results = keywords.map((keyword) => {
    const normalizedKeyword = normalizeCode(keyword);
    return {
      keyword,
      passed: normalizedStudent.includes(normalizedKeyword)
    };
  });

  const passedCount = results.filter((item) => item.passed).length;
  const score = results.length === 0 ? 0 : Math.round((passedCount / results.length) * 100);
  const passed = score === 100;

  return {
    ok: true,
    score,
    passed,
    evaluationType: "contains_keywords",
    message: passed
      ? "Correcto. Su solucion contiene los elementos esperados."
      : "La solucion esta incompleta. Revise los elementos esperados que todavia faltan.",
    details: {
      keywordResults: results
    }
  };
}

async function evaluateSameOutput({ referenceCode, studentCode }) {
  const referenceExecution = await runJavaScriptCode(referenceCode);
  const studentExecution = await runJavaScriptCode(studentCode);

  if (!referenceExecution.ok) {
    return {
      ok: true,
      score: 0,
      passed: false,
      evaluationType: "same_output",
      message: "El codigo solucion del profesor tiene un error. El profesor debe revisar el codigo esperado.",
      details: {
        teacherError: referenceExecution.error
      }
    };
  }

  if (!studentExecution.ok) {
    return {
      ok: true,
      score: 0,
      passed: false,
      evaluationType: "same_output",
      message: "Su codigo tiene un error de ejecucion.",
      details: {
        error: studentExecution.error,
        expectedOutput: normalizeOutput(referenceExecution.output)
      }
    };
  }

  const expectedOutput = normalizeOutput(referenceExecution.output);
  const studentOutput = normalizeOutput(studentExecution.output);
  const passed = JSON.stringify(expectedOutput) === JSON.stringify(studentOutput);

  return {
    ok: true,
    score: passed ? 100 : 0,
    passed,
    evaluationType: "same_output",
    message: passed
      ? "Correcto. Su codigo produce el mismo resultado que la solucion esperada."
      : "Su codigo se ejecuta, pero el resultado no coincide con el esperado.",
    details: {
      expectedOutput,
      studentOutput
    }
  };
}

module.exports = {
  evaluateSimple
};
