using MediatR;

namespace INK.ERP.Application.Common.Interfaces;

public interface IQuery<out TResponse> : IRequest<TResponse>
{
}
