import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface LegalSection {
  title: string;
  paragraphs: string[];
}
const terms: LegalSection[] = [
  {
    title: '1. Sobre MAPREKO',
    paragraphs: [
      'MAPREKO es una herramienta digital de Kolectiv para organizar información relacionada con el cuidado y mantenimiento de propiedades. Su disponibilidad, funciones y contenido pueden evolucionar.',
      'Estos términos describen el uso del servicio. No crean una relación de asesoría técnica, profesional, de emergencia ni de administración inmobiliaria entre Kolectiv y la persona usuaria.',
    ],
  },
  {
    title: '2. Cuenta y acceso',
    paragraphs: [
      'Para acceder, debes usar una cuenta de Google válida y mantener sus credenciales seguras. Eres responsable de la actividad de tu cuenta y de avisar a Kolectiv por el canal oficial de asistencia que te hayan indicado si detectas un acceso no autorizado.',
      'Al usar un espacio compartido, aceptas respetar los permisos y las instrucciones de su organización. Sus integrantes solo deben recibir el acceso necesario para su función.',
    ],
  },
  {
    title: '3. Uso responsable',
    paragraphs: [
      'Usa MAPREKO únicamente para fines legales y autorizados. No intentes acceder a cuentas, propiedades o información ajenas; interferir con el servicio; introducir código malicioso; ni eludir controles de seguridad.',
      'Solo agrega información que tengas derecho a registrar y compartir. No incluyas datos sensibles o personales que no sean necesarios para la gestión de la propiedad.',
    ],
  },
  {
    title: '4. Contenido de mantenimiento',
    paragraphs: [
      'Las guías son generales, editoriales e informativas. No constituyen instrucciones de reparación profesional, diagnóstico, inspección, recomendación personalizada ni respuesta de emergencia; tampoco sustituyen manuales, códigos, permisos o normas locales.',
      'Las tareas, frecuencias y fechas son organizativas. Verifica que sean adecuadas para la propiedad y el equipo. Las fechas dependen de la zona horaria registrada. En esta etapa, un plan conserva una frecuencia y su próxima fecha, pero no genera automáticamente las tareas siguientes.',
      'No realices una tarea si hay riesgo para las personas, la propiedad o el ambiente. Detente y solicita asistencia profesional calificada o contacta servicios locales de emergencia cuando sea necesario.',
    ],
  },
  {
    title: '5. Información y responsabilidades',
    paragraphs: [
      'Eres responsable de la exactitud y actualización de la información que agregues y de contar con autorización para administrarla. Kolectiv no garantiza que los datos ingresados por usuarios sean exactos o completos.',
      'En la medida permitida por las leyes aplicables, MAPREKO se ofrece según su disponibilidad y sin garantía de que sea ininterrumpido o libre de errores. Nada aquí limita derechos de consumidores que la ley aplicable declare irrenunciables ni excluye responsabilidad que legalmente no pueda excluirse.',
    ],
  },
  {
    title: '6. Disponibilidad y cambios',
    paragraphs: [
      'Podemos actualizar, suspender o retirar funciones para mantener o mejorar el servicio, proteger cuentas o cumplir obligaciones legales. Procuraremos comunicar los cambios importantes por medios razonables.',
      'El proveedor de inicio de sesión de Google es un tercero y sus servicios se rigen también por sus propias condiciones y políticas.',
    ],
  },
  {
    title: '7. Suspensión y terminación',
    paragraphs: [
      'Podemos restringir el acceso cuando sea necesario para proteger a las personas usuarias, la seguridad o el funcionamiento del servicio, atender una obligación legal o responder a un uso que incumpla estos términos.',
      'Si deseas dejar de usar MAPREKO, puedes cerrar sesión y solicitar orientación por el canal oficial de asistencia. La eliminación de datos se gestiona según la funcionalidad disponible, las obligaciones aplicables y el aviso de privacidad.',
    ],
  },
  {
    title: '8. Ley aplicable y contacto',
    paragraphs: [
      'MAPREKO está inicialmente dirigido a usuarios en la República Dominicana. Se aplicarán las leyes y autoridades competentes que correspondan, respetando las normas imperativas de protección al consumidor y demás derechos que resulten aplicables en el lugar de residencia de cada persona, incluso cuando acceda desde otro país, incluidos países de Latinoamérica o Estados Unidos. Este texto no afirma cumplimiento universal de leyes extranjeras.',
      'Antes de la publicación definitiva, Kolectiv debe completar aquí su razón social, domicilio y canal verificable para consultas legales y de soporte, y someter estos términos a revisión jurídica en las jurisdicciones donde ofrezca el servicio.',
    ],
  },
];
const privacy: LegalSection[] = [
  {
    title: '1. Quién gestiona la información',
    paragraphs: [
      'Este aviso explica de manera general la información tratada al usar MAPREKO. Kolectiv debe confirmar y publicar la identidad legal y los datos de contacto del responsable del servicio antes de poner este aviso en vigor.',
      'El servicio está inicialmente dirigido a personas en la República Dominicana. Si se ofrece en otros países, se deben evaluar los requisitos locales, incluidos los de países de Latinoamérica y Estados Unidos. Este aviso no representa una certificación ni una garantía de cumplimiento legal universal.',
    ],
  },
  {
    title: '2. Información que puede tratarse',
    paragraphs: [
      'Identidad y cuenta: nombre, correo electrónico e imagen de perfil recibidos del proveedor de inicio de sesión, junto con identificadores técnicos de la cuenta.',
      'Información del servicio: propiedades, ubicaciones, tareas, fechas, planes de mantenimiento, notas y contenido que tú u otros integrantes de un espacio agreguen.',
      'Seguridad y uso: datos necesarios para mantener la sesión, verificar solicitudes, prevenir usos indebidos y diagnosticar errores. Las cookies de sesión permiten autenticar tus solicitudes.',
    ],
  },
  {
    title: '3. Para qué se utiliza',
    paragraphs: [
      'La información se utiliza para autenticar cuentas, mostrar las funciones que solicitas, compartir datos de un espacio según el rol asignado, mantener la seguridad, atender solicitudes de soporte y operar o mejorar MAPREKO.',
      'Google procesa información conforme a sus propios términos y avisos. Revisa los permisos solicitados durante el inicio de sesión y las opciones de privacidad de tu cuenta Google.',
    ],
  },
  {
    title: '4. Acceso y divulgación',
    paragraphs: [
      'Las personas integrantes de un espacio pueden consultar la información de ese espacio de acuerdo con sus permisos. No registres información que no desees compartir con esas personas.',
      'Kolectiv puede utilizar proveedores tecnológicos para alojar, proteger u operar el servicio. Sus nombres, funciones, ubicaciones de tratamiento y condiciones deben confirmarse en el inventario de proveedores antes de publicar la versión final. La información también podría divulgarse cuando lo exija una obligación legal válida.',
    ],
  },
  {
    title: '5. Conservación y seguridad',
    paragraphs: [
      'La información se conserva durante el tiempo necesario para prestar el servicio, atender solicitudes y cumplir obligaciones aplicables. El plazo concreto y el procedimiento de eliminación deben ser confirmados y publicados por Kolectiv antes de la puesta en producción.',
      'Se aplican controles técnicos y organizativos para proteger cuentas y datos. Ningún sistema puede garantizar seguridad absoluta. Mantén protegida tu cuenta de Google, cierra sesiones que no reconozcas y evita compartir datos personales innecesarios.',
    ],
  },
  {
    title: '6. Tus opciones y solicitudes',
    paragraphs: [
      'Puedes revisar la información de perfil disponible, administrar tus sesiones y solicitar ayuda por el canal oficial de asistencia que te haya indicado Kolectiv. La disponibilidad de opciones para corregir, exportar o eliminar datos depende de las funciones habilitadas y de las obligaciones aplicables.',
      'Antes de la publicación definitiva, Kolectiv debe indicar un canal de contacto verificable, un plazo de respuesta, cómo verificar la identidad de quien solicita acceso y cómo tramitar derechos de privacidad en cada jurisdicción atendida.',
    ],
  },
  {
    title: '7. Cambios a este aviso',
    paragraphs: [
      'Este aviso puede actualizarse cuando cambien el servicio, sus proveedores o las obligaciones aplicables. La versión vigente debe indicar su fecha de actualización y explicar los cambios materiales por un medio razonable.',
    ],
  },
];

@Component({
  selector: 'app-legal-page',
  imports: [RouterLink],
  template: `
    <article class="legal-page">
      <a class="legal-back" routerLink="/">Volver a MAPREKO</a>
      <p class="eyebrow-dark">KOLECTIV · MAPREKO</p>
      <h1>{{ isPrivacy() ? 'Aviso de privacidad' : 'Términos y condiciones' }}</h1>
      <p class="legal-updated">Versión informativa · 2026</p>
      <aside class="legal-review" role="note">
        <strong>Información para revisión antes de publicación.</strong>
        <span
          >Este documento es una base informativa, no asesoría legal. Kolectiv debe completar la
          identidad legal, contacto, plazos de conservación y proveedores, y obtener revisión
          profesional para los países donde opere.</span
        >
      </aside>
      @for (section of sections(); track section.title) {
        <section>
          <h2>{{ section.title }}</h2>
          @for (paragraph of section.paragraphs; track $index) {
            <p>{{ paragraph }}</p>
          }
        </section>
      }
      <footer>Kolectiv - MAPREKO © 2026</footer>
    </article>
  `,
  styleUrl: './legal-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);
  readonly isPrivacy = computed(() => this.route.snapshot.data['legalPage'] === 'privacy');
  readonly sections = computed(() => (this.isPrivacy() ? privacy : terms));
}
