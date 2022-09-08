import { Formio } from "formiojs";
import "./style.css";

let timerOn = false;

const timerEl = document.getElementById("timer");
const hourEl = document.getElementById("hour");
const minuteEl = document.getElementById("minute");
const secondEl = document.getElementById("second");

(async () => {
  const data = await fetch("https://mshnegrzbwcnjvi.form.io/form6");
  const schema = await data.json();

  Formio.createForm(document.getElementById("form"), schema).then((form) => {
    // form._data.cookEnable = true;
    // form._data.enable6 = true;
    // form._data.enable7 = true;
    // form._data.enable2 = true;
    // form._data.processSteps.Cook = true;
    // form._data.cook = "6D Process (Listeria)";
    // form.triggerRedraw();

    const setCookStatuses = (status) => {
      form._data.cookStatus = status;
      form._data.status = status;
      form.triggerRedraw();
    };

    const setChillStatuses = (status, index) => {
      form._data.chillStatus = status;

      if (index === 0) {
        form._data.phase1Status = status;
        form._data.statusPhase1 = status;
      } else if (index === 1) {
        form._data.chillPhase2Status = status;
        form._data.statusPhase2 = status;
      }

      form.triggerRedraw();
    };

    form.on("change", (e) => {
      const { data } = e;
      if (!timerOn) {
        if (data.processSteps.Cook) {
          if (data.cook === "Sous Vide") {
            timerEl.classList.remove("d-none");
            const productTemperature =
              data.productTemperatureGrid.length === 0
                ? false
                : !!data.productTemperatureGrid.some(
                    (o) => o.productTemperature >= data.cookTemperature
                  );
            const time = data.timeRequired;

            if (
              isCookDataChange(
                data.cook,
                time,
                data.productTemperatureGrid.map((o) => o.productTemperature)
              ) &&
              !!data.cookTemperature &&
              productTemperature &&
              time
            ) {
              setCookStatuses("Progress");
              startTimer(time * 60, () => {
                setCookStatuses("Pass");
              });
            }
          } else if (data.cook === "6D Process (Listeria)") {
            timerEl.classList.remove("d-none");
            const productTemperature =
              data.productTemperatureGrid.length === 0
                ? false
                : !!data.productTemperatureGrid.some(
                    (o) =>
                      o.productTemperature >= data.internalProductTemperature
                  );
            const time = data.cookTimeFor6DProcess;

            if (
              isCookDataChange(
                data.cook,
                time,
                data.productTemperatureGrid.map((o) => o.productTemperature)
              ) &&
              !!data.internalProductTemperature &&
              productTemperature &&
              time
            ) {
              setCookStatuses("Progress");
              startTimer(time * 60, () => {
                setCookStatuses("Pass");
              });
            }
          } else if (data.cook === "6D Process (Clostridium)") {
            timerEl.classList.remove("d-none");
            const productTemperature =
              data.productTemperatureGrid.length === 0
                ? false
                : !!data.productTemperatureGrid.some(
                    (o) =>
                      o.productTemperature >= data.internalProductTemperature1
                  );
            const time = data.cookTimeFor6DProcess1;

            if (
              isCookDataChange(
                data.cook,
                time,
                data.productTemperatureGrid.map((o) => o.productTemperature)
              ) &&
              !!data.internalProductTemperature1 &&
              productTemperature &&
              time
            ) {
              setCookStatuses("Progress");
              startTimer(time * 60, () => {
                setCookStatuses("Pass");
              });
            }
          }
        } else if (data.processSteps.Chill) {
          if (data.chillSteps1 === "onePhaseChill") {
            timerEl.classList.remove("d-none");
            const productTemperature =
              data.productTemperatureGrid.length === 0
                ? false
                : !!data.productTemperatureGrid.some(
                    (o) => o.productTemperature >= data.upperLimit
                  );

            const time = data.timePermitted;

            if (
              isChillDataChange(
                data.chillSteps1,
                data.upperLimit,
                data.finishTemperature,
                time,
                data.productTemperatureGrid.map((o) => o.productTemperature)
              ) &&
              typeof data.upperLimit === "number" &&
              typeof data.finishTemperature === "number" &&
              time &&
              productTemperature
            ) {
              setChillStatuses("Progress", 0);
              startTimer(time * 60, () => {
                if (
                  data.productTemperatureGrid[
                    data.productTemperatureGrid.length - 1
                  ].productTemperature <= data.finishTemperature
                ) {
                  setChillStatuses("Pass", 0);
                } else {
                  setChillStatuses("Fail", 0);
                }
              });
            }
          } else if (data.chillSteps1 === "twoPhaseChill") {
            timerEl.classList.remove("d-none");
            const productTemperature =
              data.productTemperatureGrid.length === 0
                ? false
                : !!data.productTemperatureGrid.some(
                    (o) => o.productTemperature >= data.upperLimit1
                  );

            const time = data.timePermitted1;

            if (
              isChillDataChange(
                data.chillSteps1,
                data.upperLimit1,
                data.finishTemperature1,
                time,
                data.productTemperatureGrid.map((o) => o.productTemperature)
              ) &&
              typeof data.upperLimit1 === "number" &&
              typeof data.finishTemperature1 === "number" &&
              time &&
              productTemperature
            ) {
              setChillStatuses("Progress", 1);
              startTimer(time * 60, () => {
                if (
                  data.productTemperatureGrid[
                    data.productTemperatureGrid.length - 1
                  ].productTemperature <= data.finishTemperature1
                ) {
                  setChillStatuses("Pass", 1);
                } else {
                  setChillStatuses("Fail", 1);
                }
              });
            }
          }
        } else {
          timerEl.classList.add("d-none");
        }
      }
    });
  });
})();

const startTimer = (time, onDone) => {
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  setTimerElement("00", "00", "00");
  timerOn = true;
  const interval = setInterval(() => {
    seconds += 0.1;
    if (Math.round(seconds) === 60) {
      seconds = 0;

      if (minutes + 1 === 60) {
        hour += 1;
        minutes = 0;
      } else {
        minutes += 1;
      }
    }

    if (Number(seconds.toFixed(1)) % 1 === 0) {
      setTimerElement(
        hours >= 10 ? hours : "0" + hours,
        minutes >= 10 ? minutes : "0" + minutes,
        Math.round(seconds) > 9
          ? Math.round(seconds)
          : "0" + Math.round(seconds)
      );
    }

    if (seconds + minutes * 60 + hours * 3600 >= time) {
      clearInterval(interval);
      timerOn = false;
      onDone();
    }
  }, 100);
};

const setTimerElement = (hour, minute, second) => {
  hourEl.innerText = hour;
  minuteEl.innerText = minute;
  secondEl.innerText = second;
};

const cookStore = {
  cook: null,
  time: null,
  productTemperatures: [],
};

const isCookDataChange = (cook, time, productTemperatures) => {
  if (
    cookStore.cook === cook &&
    cookStore.time === time &&
    cookStore.productTemperatures.length === productTemperatures.length &&
    cookStore.productTemperatures.every((o, i) => productTemperatures[i] === o)
  ) {
    return false;
  } else if (productTemperatures.length === 0) {
    return false;
  } else {
    cookStore.cook = cook;
    cookStore.time = time;
    cookStore.productTemperatures = productTemperatures;
    return true;
  }
};

const chillStore = {
  phase: null,
  startTemp: null,
  finishTemp: null,
  time: null,
  productTemperatures: [],
};

const isChillDataChange = (
  phase,
  startTemp,
  finishTemp,
  time,
  productTemperatures
) => {
  if (
    chillStore.phase === phase &&
    chillStore.time === time &&
    chillStore.startTemp === startTemp &&
    chillStore.finishTemp === finishTemp &&
    chillStore.productTemperatures.length === productTemperatures.length &&
    chillStore.productTemperatures.every((o, i) => productTemperatures[i] === o)
  ) {
    return false;
  } else if (productTemperatures.length === 0) {
    return false;
  } else {
    chillStore.phase = phase;
    chillStore.time = time;
    chillStore.startTemp = startTemp;
    chillStore.finishTemp = finishTemp;
    cookStore.productTemperatures = productTemperatures;
    return true;
  }
};
