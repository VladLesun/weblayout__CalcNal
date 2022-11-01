const formatCurrency = n =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 2,
    }).format(n);



const debounceTimer = (fn, msec) => {
    let lastCall = 0;
    let lastCallTimer;

    return (...arg) => {
        const previousCall = lastCall;
        lastCall = Date.now();

        if (previousCall && ((lastCall - previousCall) <= msec)) {
            clearTimeout(lastCallTimer);
        }

        lastCallTimer = setTimeout(() => {
            fn(...arg);
        }, msec);
    };
};


{
    // ! Навигация
    const navigationLinks = document.querySelectorAll('.navigation__link');
    const calcElems = document.querySelectorAll('.calc');

    for (let i = 0; i < navigationLinks.length; i++) {
        navigationLinks[i].addEventListener('click', (e) => {
            e.preventDefault();
            for (let j = 0; j < calcElems.length; j++) {
                if (navigationLinks[i].dataset.tax === calcElems[j].dataset.tax) {
                    calcElems[j].classList.add('calc_active');
                    navigationLinks[j].classList.add('navigation__link_active');

                } else {
                    calcElems[j].classList.remove('calc_active');
                    navigationLinks[j].classList.remove('navigation__link_active');
                }
            }
        });
    };
}



{
    // ! Расчет налога для самозанятого или ИП НПД с учетом вычета

    const selfEmployed = document.querySelector('.self-employment');
    const formSelfEmployed = selfEmployed.querySelector('.calc__form');
    const resultTaxSelfEmployed = selfEmployed.querySelector('.result__tax');
    const calcCompensation = selfEmployed.querySelector('.calc__label_compensation');
    const resultBlockCompensation = selfEmployed.querySelector('.result__block_compensation');
    const resultTaxCompensation = selfEmployed.querySelector('.result__tax_compensation');
    const resultTaxRestCompensation = selfEmployed.querySelector('.result__tax_rest-compensation');
    const resultTaxResult = selfEmployed.querySelector('.result__tax_result');

    const checkCompensation = () => {
        const setDisplay = formSelfEmployed.addCompensation.checked ? '' : 'none';
        const setDisplayBlock = formSelfEmployed.addCompensation.checked ? resultBlockCompensation.style.display = '' : resultBlockCompensation.style.display = 'none';
        calcCompensation.style.display = setDisplay;
        calcCompensation.style.display = setDisplayBlock;

        // todo Перебираем методом все элементы и скрываем их.
        // resultBlockCompensation.forEach((elem) => {
        //     elem.style.display = setDisplay;
        // });
    };

    checkCompensation();

    const handlerForm = () => {
        const individualValue = formSelfEmployed.individual.value;
        const entityValue = formSelfEmployed.entity.value;

        const resIndividual = individualValue * 0.04;
        const resEntity = entityValue * 0.06;

        checkCompensation();

        const tax = resIndividual + resEntity;

        formSelfEmployed.compensation.value = formSelfEmployed.compensation.value > 10000 ? 10000 : formSelfEmployed.compensation.value;

        const benefit = +formSelfEmployed.compensation.value;
        const resBenefit = individualValue * 0.01 + entityValue * 0.02;
        const finalBenefit = benefit < resBenefit ? 0 : benefit - resBenefit;
        const finalTax = tax - (benefit - finalBenefit);

        resultTaxSelfEmployed.textContent = formatCurrency(tax);
        resultTaxCompensation.textContent = formatCurrency(benefit - finalBenefit);
        resultTaxRestCompensation.textContent = formatCurrency(finalBenefit);
        resultTaxResult.textContent = formatCurrency(finalTax);
    };

    formSelfEmployed.addEventListener('reset', () => {
        setTimeout(handlerForm);
    });
    formSelfEmployed.addEventListener('input', debounceTimer(handlerForm), 300);
}



{
    // ! Налоговый вычет 13%

    const taxReturn = document.querySelector('.tax-return');
    const formTaxReturn = taxReturn.querySelector('.calc__form');

    const resultTaxNdfl = taxReturn.querySelector('.result__tax_ndfl');
    const resultTaxPossible = taxReturn.querySelector('.result__tax_possible');
    const resultTaxDeduction = taxReturn.querySelector('.result__tax_deduction');

    const handlerForm = () => {
        const expenses = +formTaxReturn.expenses.value;
        const income = +formTaxReturn.income.value;

        const sumExpenses = +formTaxReturn.sumExpenses.value;

        const ndfl = income * 0.13;
        const possibleDeduction = expenses < sumExpenses ? expenses * 0.13 : sumExpenses * 0.13;
        const deduction = possibleDeduction < ndfl ? possibleDeduction : ndfl;

        resultTaxNdfl.textContent = formatCurrency(ndfl);
        resultTaxPossible.textContent = formatCurrency(possibleDeduction);
        resultTaxDeduction.textContent = formatCurrency(deduction);
    };

    formTaxReturn.addEventListener('reset', () => {
        setTimeout(handlerForm)
    });
    formTaxReturn.addEventListener('input', debounceTimer(handlerForm), 300);
}



{
    // ! Упрощенная система налогообложения для ИП и ООО

    const LIMIT = 300000;

    const usn = document.querySelector('.usn');
    const formUsn = usn.querySelector('.calc__form');

    const calcLabelExpenses = usn.querySelector('.calc__label_expenses');
    const calcLabelProperty = usn.querySelector('.calc__label_property');
    const resultBlockProperty = usn.querySelector('.result__block_property');

    const resultTaxTotal = usn.querySelector('.result__tax_total');
    const resultTaxProperty = usn.querySelector('.result__tax_property');


    const typeTax = {
        'income': () => {
            calcLabelExpenses.style.display = 'none';
            calcLabelProperty.style.display = 'none';
            resultBlockProperty.style.display = 'none';

            formUsn.expenses.value = '';
            formUsn.property.value = '';
        },
        'ie-expenses': () => {
            calcLabelExpenses.style.display = '';
            calcLabelProperty.style.display = 'none';
            resultBlockProperty.style.display = 'none';

            formUsn.property.value = '';
        },
        'llc-expenses': () => {
            calcLabelExpenses.style.display = '';
            calcLabelProperty.style.display = '';
            resultBlockProperty.style.display = '';
        },
    }

    const percent = {
        'income': 0.06,
        'ie-expenses': 0.15,
        'llc-expenses': 0.15,
    };

    typeTax[formUsn.typeTax.value]();

    const handlerForm = () => {
        typeTax[formUsn.typeTax.value]();

        const income = +formUsn.income.value;
        const expenses = +formUsn.expenses.value;
        const contributions = +formUsn.contributions.value;
        const property = +formUsn.property.value;

        let profit = income - contributions;

        // todo ИП, Доходы минус расходы
        if (formUsn.typeTax.value !== 'income') {
            profit -= expenses;
        };

        // todo Доходы
        const taxBigIncome = income > LIMIT ? (profit - LIMIT) * 0.01 : 0;
        const sum = profit - (taxBigIncome < 0 ? 0 : taxBigIncome);
        const tax = sum * percent[formUsn.typeTax.value];

        resultTaxTotal.textContent = formatCurrency(tax < 0 ? 0 : tax);

        // todo ООО, Доходы минус расходы
        const taxProperty = property * 0.02;

        resultTaxProperty.textContent = formatCurrency(taxProperty);
    };

    formUsn.addEventListener('reset', () => {
        setTimeout(handlerForm)
    });
    formUsn.addEventListener('input', debounceTimer(handlerForm), 300);
}



{
    // ! Общая система налогообложения

    const osno = document.querySelector('.osno');
    const formOsno = osno.querySelector('.calc__form');
    const ndflExpenses = osno.querySelector('.result__block_ndfl-expenses');
    const ndflIncome = osno.querySelector('.result__block_ndfl-income');
    const profit = osno.querySelector('.result__block_profit');
    const resultTaxNds = osno.querySelector('.result__tax_nds')
    const resultTaxProperty = osno.querySelector('.result__tax_property')
    const resultTaxNdflExpenses = osno.querySelector('.result__tax_ndfl-expenses')
    const resultTaxNdflIncome = osno.querySelector('.result__tax_ndfl-income')
    const resultTaxProfit = osno.querySelector('.result__tax_profit')

    const checkFormBusiness = () => {
        if (formOsno.formBusiness.value === 'ie') {
            ndflExpenses.style.display = '';
            ndflIncome.style.display = '';
            profit.style.display = 'none';
        };

        if (formOsno.formBusiness.value === 'llc') {
            ndflExpenses.style.display = 'none';
            ndflIncome.style.display = 'none';
            profit.style.display = '';
        };
    };

    checkFormBusiness();

    const handlerForm = () => {
        checkFormBusiness();

        const income = +formOsno.income.value;
        const expenses = +formOsno.expenses.value;
        const property = +formOsno.property.value;

        // todo НДС
        const nds = income * 0.2;
        resultTaxNds.textContent = formatCurrency(nds);
        // todo Налог на имущество
        const taxProperty = property * 0.02;
        resultTaxProperty.textContent = formatCurrency(taxProperty);
        // todo НДФЛ(Вычет в виде расходов)
        const profit = income < expenses ? 0 : income - expenses;
        const ndflExpensesTotal = profit * 0.13;
        resultTaxNdflExpenses.textContent = formatCurrency(ndflExpensesTotal);
        // todo НДФЛ(Вычет 20 % от доходов)
        const ndflIncomeTotal = (income - nds) * 0.13;
        resultTaxNdflIncome.textContent = formatCurrency(ndflIncomeTotal);
        // todo Налог на прибыль 20 %
        const taxProfit = profit * 0.2;
        resultTaxProfit.textContent = formatCurrency(taxProfit);
    };

    formOsno.addEventListener('reset', () => {
        setTimeout(handlerForm);
    });
    formOsno.addEventListener('input', debounceTimer(handlerForm), 300);
}



{
    // ! Автоматизированная упрощенная система налогообложения

    const ausn = document.querySelector('.ausn');
    const formAusn = ausn.querySelector('.calc__form');
    const resultTaxTotal = ausn.querySelector('.result__tax_total');
    const resultProfit = ausn.querySelector('.result__tax_profit');
    const calcLabelExpenses = ausn.querySelector('.calc__label_expenses');
    const resultBlockProfit = ausn.querySelector('.result__block_profit');

    calcLabelExpenses.style.display = 'none';
    resultBlockProfit.style.display = 'none';

    const handlerForm = () => {

        const income = +formAusn.income.value;

        if (formAusn.type.value === 'income') {
            calcLabelExpenses.style.display = 'none';
            resultBlockProfit.style.display = 'none';

            resultTaxTotal.textContent = formatCurrency(income * 0.08);
            formAusn.expenses.value = '';
        };

        if (formAusn.type.value === 'expenses') {
            const expenses = +formAusn.expenses.value;
            const profit = income < expenses ? 0 : income - expenses;
            calcLabelExpenses.style.display = '';
            resultBlockProfit.style.display = '';

            resultProfit.textContent = formatCurrency(profit);
            resultTaxTotal.textContent = formatCurrency(profit * 0.2);

        };
    };

    formAusn.addEventListener('reset', () => {
        setTimeout(handlerForm);
    });
    formAusn.addEventListener('input', debounceTimer(handlerForm), 300);
}
