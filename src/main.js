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
    console.log(form);
    const setCookStatuses = (status) => {
      form._data.cookStatus = status;
      form._data.cookStatus1 = status;
      form.components[4].components[0].components[0].components[2].triggerRedraw();
      form.components[5].components[0].components[4].triggerRedraw();
    };

    const setChillStatuses = (status, index) => {
      form._data.chillStatus = status;
      form.components[4].components[0].components[0].components[3].triggerRedraw();

      if (index === 0) {
        form._data.phase1Status = status;
        form._data.statusPhase1 = status;
        form.components[4].components[0].components[4].components[1].components[1].triggerRedraw();
        form.components[5].components[1].components[0].components[3].triggerRedraw();
      } else if (index === 1) {
        form._data.chillPhase2Status = status;
        form._data.statusPhase2 = status;
        form.components[4].components[0].components[4].components[2].components[1].triggerRedraw();
        form.components[5].components[1].components[1].components[3].triggerRedraw();
      }
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
                    (o) => o.productTemperature >= data.upperLimit
                  );

            const time1 = data.timePermitted;
            const time2 = data.timePermitted1;

            if (
              isChill2DataChange(
                data.upperLimit1,
                data.upperLimit1,
                data.finishTemperature,
                data.finishTemperature1,
                time1,
                time2,
                data.productTemperatureGrid.map((o) => o.productTemperature)
              ) &&
              typeof data.upperLimit === "number" &&
              typeof data.upperLimit1 === "number" &&
              typeof data.finishTemperature === "number" &&
              typeof data.finishTemperature1 === "number" &&
              time1 &&
              time2 &&
              productTemperature
            ) {
              const points = [
                {
                  time: time1 * 60,
                  action: () => {
                    if (
                      data.productTemperatureGrid[
                        data.productTemperatureGrid.length - 1
                      ].productTemperature <= data.finishTemperature
                    ) {
                      setChillStatuses("Pass", 0);
                    } else {
                      setChillStatuses("Fail", 0);
                    }
                  },
                },
              ];

              setChillStatuses("Progress", 0);
              setChillStatuses("Progress", 1);
              startTimer(
                (time1 + time2) * 60,
                () => {
                  if (
                    data.productTemperatureGrid[
                      data.productTemperatureGrid.length - 1
                    ].productTemperature <= data.finishTemperature1
                  ) {
                    setChillStatuses("Pass", 1);
                  } else {
                    setChillStatuses("Fail", 1);
                  }
                },
                points
              );
            }
          }
        } else {
          timerEl.classList.add("d-none");
        }
      }
    });
  });
})();

const startTimer = (time, onDone, points = []) => {
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
        hours += 1;
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

    points.forEach((point) => {
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds >= point.time && totalSeconds <= point.time + 0.1) {
        point.action();
      }
    });

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
    chillStore.productTemperatures = productTemperatures;
    return true;
  }
};

const chillStore2 = {
  startTemp1: null,
  startTemp2: null,
  finishTemp1: null,
  finishTemp2: null,
  time1: null,
  time2: null,
  productTemperatures: [],
};

const isChill2DataChange = (
  startTemp1,
  startTemp2,
  finishTemp1,
  finishTemp2,
  time1,
  time2,
  productTemperatures
) => {
  if (
    chillStore2.time1 === time1 &&
    chillStore2.time2 === time2 &&
    chillStore2.startTemp1 === startTemp1 &&
    chillStore2.startTemp2 === startTemp2 &&
    chillStore2.finishTemp1 === finishTemp1 &&
    chillStore2.finishTemp2 === finishTemp2 &&
    chillStore.productTemperatures.length === productTemperatures.length &&
    chillStore.productTemperatures.every((o, i) => productTemperatures[i] === o)
  ) {
    return false;
  } else if (productTemperatures.length === 0) {
    return false;
  } else {
    chillStore.time1 = time1;
    chillStore.time2 = time2;
    chillStore.startTemp1 = startTemp1;
    chillStore.startTemp2 = startTemp2;
    chillStore.finishTemp1 = finishTemp1;
    chillStore.finishTemp2 = finishTemp2;
    chillStore.productTemperatures = productTemperatures;
    return true;
  }
};
