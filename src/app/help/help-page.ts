import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-help-page',
  imports: [RouterLink, Icon],
  template: `
    <header class="help-heading">
      <p class="eyebrow-dark">ESTAMOS PARA AYUDARTE</p>
      <h1>Centro de ayuda</h1>
      <p>Respuestas claras para aprovechar MAPREKO y cuidar tus espacios con confianza.</p>
    </header>
    <nav class="help-shortcuts" aria-label="Temas de ayuda">
      <a href="#primeros-pasos"><app-icon name="grid" /> Primeros pasos</a>
      <a href="#planes"><app-icon name="calendar" /> Planes y tareas</a>
      <a href="#seguridad"><app-icon name="settings" /> Cuenta y seguridad</a>
      <a href="#contenido"><app-icon name="book" /> Guías y recomendaciones</a>
    </nav>
    <div class="help-layout">
      <main class="help-sections">
        <section id="primeros-pasos" class="help-section">
          <h2>Primeros pasos</h2>
          <details open>
            <summary>¿Qué puedo hacer en Mi espacio?</summary>
            <p>
              Registra las propiedades que administras, consulta las tareas del mes, organiza planes
              preventivos y explora guías prácticas. Los datos se muestran según tu acceso a cada
              espacio.
            </p>
          </details>
          <details>
            <summary>¿Cómo agrego una propiedad?</summary>
            <p>
              Desde Resumen, elige «Nueva propiedad» y completa sus datos. La propiedad queda
              asociada al espacio al que tienes acceso. Verifica los datos antes de guardar.
            </p>
          </details>
          <details>
            <summary>¿Por qué no puedo crear o modificar algo?</summary>
            <p>
              Los permisos dependen de tu rol y de tu membresía activa. Las personas con acceso de
              consulta pueden leer la información, pero no crear ni modificar elementos. Si crees
              que tu rol es incorrecto, consulta a la persona administradora de tu espacio.
            </p>
          </details>
        </section>
        <section id="planes" class="help-section">
          <h2>Planes, tareas y calendario</h2>
          <details>
            <summary>¿Qué sucede al crear un plan de mantenimiento?</summary>
            <p>
              Se guarda el plan preventivo y se crea de manera atómica su primera tarea. Si la
              operación no se completa, ninguno de los dos queda guardado. Puedes pausar y reactivar
              un plan sin borrar su historial.
            </p>
          </details>
          <details>
            <summary>¿El sistema crea automáticamente todas las tareas futuras?</summary>
            <p>
              Aún no. El plan guarda su frecuencia y próxima fecha, pero las siguientes ocurrencias
              no se generan automáticamente en esta etapa. Revisa el calendario y registra las
              tareas futuras cuando corresponda.
            </p>
          </details>
          <details>
            <summary>¿Cómo se muestran las fechas?</summary>
            <p>
              Las fechas de tareas se presentan según la zona horaria configurada para la propiedad.
              Comprueba esa zona horaria si una fecha aparece un día antes o después de lo esperado.
            </p>
          </details>
          <details>
            <summary>¿Pausar un plan elimina tareas anteriores?</summary>
            <p>
              No. Pausar detiene el estado activo del plan y conserva sus datos e historial. La
              acción no cancela ni modifica tareas anteriores.
            </p>
          </details>
        </section>
        <section id="seguridad" class="help-section">
          <h2>Cuenta y seguridad</h2>
          <details>
            <summary>¿Cómo inicio sesión?</summary>
            <p>
              MAPREKO utiliza el inicio de sesión de Google. Comprueba que seleccionaste la cuenta
              correcta y que tu navegador permite continuar con el proveedor de identidad.
            </p>
          </details>
          <details>
            <summary>¿Qué puedo hacer en «Seguridad y sesiones»?</summary>
            <p>
              Revisa las sesiones de tu cuenta y cierra las que ya no reconozcas o necesites. Si
              sospechas que otra persona usó tu cuenta de Google, protege esa cuenta directamente
              con Google.
            </p>
          </details>
          <details>
            <summary>¿Cómo se comparten los datos de una organización?</summary>
            <p>
              La información de un espacio es visible para sus integrantes de acuerdo con su rol. No
              registres datos personales innecesarios y comparte el acceso solo con personas
              autorizadas.
            </p>
          </details>
        </section>
        <section id="contenido" class="help-section">
          <h2>Guías y recomendaciones</h2>
          <details>
            <summary>¿Las guías sustituyen a un técnico?</summary>
            <p>
              No. Son contenido informativo general y no sustituyen el manual del fabricante, una
              inspección profesional ni el cumplimiento de normas locales. No manipules
              electricidad, gas, refrigerantes, estructuras ni equipos peligrosos siguiendo solo una
              guía.
            </p>
          </details>
          <details>
            <summary>¿Qué hago si detecto un riesgo inmediato?</summary>
            <p>
              Aléjate del área, evita intervenir y contacta a los servicios de emergencia locales o
              a un profesional calificado según corresponda. Para lluvias y otros peligros, sigue
              los avisos oficiales de tu zona.
            </p>
          </details>
          <details>
            <summary>¿Las recomendaciones se generan con mis datos?</summary>
            <p>
              Las guías disponibles son contenido editorial general; no son diagnósticos ni análisis
              automáticos de una propiedad. Evalúa cada situación y solicita asistencia profesional
              cuando tengas dudas.
            </p>
          </details>
        </section>
      </main>
      <aside class="help-aside">
        <div class="help-aside-card">
          <app-icon name="help" />
          <h2>¿Necesitas más ayuda?</h2>
          <p>
            Si la respuesta depende de tus permisos o de los datos de tu organización, consulta a su
            administrador o usa el canal oficial de asistencia de Kolectiv que te hayan indicado.
          </p>
        </div>
        <div class="help-aside-links">
          <h2>Información legal</h2>
          <a routerLink="/terms">Términos y condiciones <app-icon name="arrow" /></a
          ><a routerLink="/privacy">Aviso de privacidad <app-icon name="arrow" /></a>
        </div>
      </aside>
    </div>
    <footer class="help-footer">Kolectiv - MAPREKO © 2026</footer>
  `,
  styleUrl: './help-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPage {}
